import "server-only";
import { prisma } from "./prisma";
import type { CardCache } from "@prisma/client";
import { getMtgjsonUsdPrices } from "./mtgjson";

const API = "https://api.scryfall.com";

function headers() {
  return {
    "User-Agent":
      process.env.SCRYFALL_USER_AGENT || "PreconLeague/1.0 (self-hosted)",
    Accept: "application/json",
  };
}

// --- Rate limiting ----------------------------------------------------------
// Scryfall asks consumers to insert 50-100ms of delay between requests. We
// serialize all outbound calls through a single promise chain to be polite.
let chain: Promise<unknown> = Promise.resolve();
const MIN_DELAY_MS = 100;

function schedule<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(async () => {
    const result = await fn();
    await new Promise((r) => setTimeout(r, MIN_DELAY_MS));
    return result;
  });
  // keep the chain alive even if a call rejects
  chain = run.catch(() => undefined);
  return run;
}

async function scryfallFetch<T>(path: string, init?: RequestInit): Promise<T> {
  return schedule(async () => {
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: { ...headers(), ...(init?.headers ?? {}) },
      // Scryfall data is fine to cache briefly; prices update once a day.
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new ScryfallError(
        `Scryfall ${path} -> ${res.status} ${res.statusText} ${body.slice(0, 200)}`,
        res.status,
      );
    }
    return (await res.json()) as T;
  });
}

export class ScryfallError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

// --- Raw Scryfall card shape (only the fields we use) -----------------------
type RawImageUris = {
  small?: string;
  normal?: string;
  art_crop?: string;
};

type RawCard = {
  id: string;
  oracle_id?: string;
  name: string;
  set: string;
  collector_number: string;
  rarity?: string;
  cmc?: number;
  type_line?: string;
  oracle_text?: string;
  colors?: string[];
  color_identity?: string[];
  image_uris?: RawImageUris;
  card_faces?: { image_uris?: RawImageUris; type_line?: string; oracle_text?: string }[];
  prices?: { usd?: string | null; usd_foil?: string | null };
  scryfall_uri?: string;
};

function parsePrice(value?: string | null): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function imagesFor(raw: RawCard): RawImageUris {
  if (raw.image_uris) return raw.image_uris;
  // double-faced / split cards keep images on the first face
  return raw.card_faces?.[0]?.image_uris ?? {};
}

function deriveCanBeCommander(raw: RawCard): boolean {
  const type = (raw.type_line ?? raw.card_faces?.[0]?.type_line ?? "").toLowerCase();
  const text = (raw.oracle_text ?? raw.card_faces?.[0]?.oracle_text ?? "").toLowerCase();
  if (text.includes("can be your commander")) return true;
  return type.includes("legendary") && type.includes("creature");
}

function toCacheRow(raw: RawCard) {
  const img = imagesFor(raw);
  const priceUsd = parsePrice(raw.prices?.usd);
  return {
    id: raw.id,
    oracleId: raw.oracle_id ?? raw.id,
    name: raw.name,
    setCode: raw.set,
    collectorNo: raw.collector_number,
    rarity: raw.rarity ?? null,
    manaValue: raw.cmc ?? 0,
    typeLine: raw.type_line ?? raw.card_faces?.[0]?.type_line ?? "",
    oracleText: raw.oracle_text ?? raw.card_faces?.[0]?.oracle_text ?? null,
    colors: raw.colors ?? [],
    colorIdentity: raw.color_identity ?? [],
    canBeCommander: deriveCanBeCommander(raw),
    priceUsd,
    priceUsdFoil: parsePrice(raw.prices?.usd_foil),
    priceSource: priceUsd != null ? "scryfall" : null,
    imageSmall: img.small ?? null,
    imageNormal: img.normal ?? null,
    imageArtCrop: img.art_crop ?? null,
    scryfallUri: raw.scryfall_uri ?? null,
    fetchedAt: new Date(),
  };
}

async function upsertCache(raw: RawCard): Promise<CardCache> {
  const row = toCacheRow(raw);
  // On update, don't let a missing Scryfall price clobber one the MTGJSON
  // fallback already filled in — only overwrite priceUsd/source when Scryfall
  // actually has a price.
  const update = { ...row };
  if (row.priceUsd == null) {
    delete (update as Partial<typeof update>).priceUsd;
    delete (update as Partial<typeof update>).priceSource;
  }
  return prisma.cardCache.upsert({
    where: { id: row.id },
    create: row,
    update,
  });
}

// --- Public API -------------------------------------------------------------

/**
 * Resolve a list of card names to cached Scryfall cards. Uses the batch
 * /cards/collection endpoint (75 identifiers per call) and writes everything
 * to the local cache. Returns resolved cards keyed by lowercased name plus the
 * list of names that could not be found.
 */
export async function resolveCardsByName(names: string[]): Promise<{
  byName: Map<string, CardCache>;
  notFound: string[];
}> {
  const unique = Array.from(
    new Map(names.map((n) => [n.trim().toLowerCase(), n.trim()])).values(),
  ).filter(Boolean);

  const byName = new Map<string, CardCache>();
  const notFound: string[] = [];

  for (let i = 0; i < unique.length; i += 75) {
    const batch = unique.slice(i, i + 75);
    const data = await scryfallFetch<{ data: RawCard[]; not_found: { name?: string }[] }>(
      "/cards/collection",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifiers: batch.map((name) => ({ name })),
        }),
      },
    );

    for (const raw of data.data) {
      const cached = await upsertCache(raw);
      byName.set(raw.name.toLowerCase(), cached);
    }
    for (const nf of data.not_found ?? []) {
      if (nf.name) notFound.push(nf.name);
    }
  }

  return { byName, notFound };
}

/** Look up a single card by exact (or fuzzy) name. */
export async function resolveCardByName(name: string): Promise<CardCache | null> {
  try {
    const raw = await scryfallFetch<RawCard>(
      `/cards/named?fuzzy=${encodeURIComponent(name)}`,
    );
    return upsertCache(raw);
  } catch (err) {
    if (err instanceof ScryfallError && err.status === 404) return null;
    throw err;
  }
}

/** Full-text card search used by the deck editor's "add card" box. */
export async function searchCards(query: string): Promise<CardCache[]> {
  if (!query.trim()) return [];
  try {
    const data = await scryfallFetch<{ data: RawCard[] }>(
      `/cards/search?q=${encodeURIComponent(query)}&unique=cards&order=name&page=1`,
    );
    const cards: CardCache[] = [];
    for (const raw of data.data.slice(0, 20)) {
      cards.push(await upsertCache(raw));
    }
    return cards;
  } catch (err) {
    if (err instanceof ScryfallError && err.status === 404) return [];
    throw err;
  }
}

export type RefreshResult = {
  updated: number;
  /** How many cards got a price from the MTGJSON fallback (no Scryfall price). */
  mtgjsonFallback: number;
};

/** Refresh prices/data for the given cached card ids. */
export async function refreshCards(ids: string[]): Promise<RefreshResult> {
  let updated = 0;
  for (let i = 0; i < ids.length; i += 75) {
    const batch = ids.slice(i, i + 75);
    const data = await scryfallFetch<{ data: RawCard[] }>("/cards/collection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifiers: batch.map((id) => ({ id })) }),
    });
    for (const raw of data.data) {
      await upsertCache(raw);
      updated += 1;
    }
  }
  const mtgjsonFallback = await applyMtgjsonFallback(ids);
  return { updated, mtgjsonFallback };
}

/**
 * For any of the given cards still missing a USD price after the Scryfall
 * refresh, try MTGJSON. Failures here are logged but never abort the refresh.
 */
async function applyMtgjsonFallback(ids: string[]): Promise<number> {
  const targets = await prisma.cardCache.findMany({
    where: { id: { in: ids }, priceUsd: null },
    select: { id: true, setCode: true, mtgjsonUuid: true },
  });
  if (targets.length === 0) return 0;

  try {
    const { prices, resolvedUuids } = await getMtgjsonUsdPrices(targets);
    let filled = 0;
    for (const t of targets) {
      const newUuid = t.mtgjsonUuid == null ? resolvedUuids.get(t.id) ?? null : null;
      const price = prices.get(t.id) ?? null;
      if (newUuid == null && price == null) continue;
      await prisma.cardCache.update({
        where: { id: t.id },
        data: {
          ...(newUuid != null ? { mtgjsonUuid: newUuid } : {}),
          ...(price != null ? { priceUsd: price, priceSource: "mtgjson" } : {}),
        },
      });
      if (price != null) filled += 1;
    }
    return filled;
  } catch (err) {
    console.error("MTGJSON price fallback failed:", err);
    return 0;
  }
}
