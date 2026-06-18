import "server-only";
import { gunzipSync } from "node:zlib";

// MTGJSON is a daily-built aggregation of vendor prices. It has no per-card
// API, so we map our Scryfall printings to MTGJSON uuids via the per-set files
// and read current USD retail prices from the small "today" price snapshot.
// Used only as a fallback when Scryfall has no USD price for a card.

const BASE = "https://mtgjson.com/api/v5";

// USD retail providers in order of preference. Cardmarket is intentionally
// excluded here because it is priced in EUR.
const USD_PROVIDERS = ["tcgplayer", "cardkingdom", "cardsphere"] as const;

type PricePoints = Record<string, number>;
type ProviderPrices = {
  currency?: string;
  retail?: { normal?: PricePoints; foil?: PricePoints };
  buylist?: { normal?: PricePoints; foil?: PricePoints };
};
type CardPrices = {
  paper?: Record<string, ProviderPrices>;
  mtgo?: Record<string, ProviderPrices>;
};
type AllPricesToday = { data: Record<string, CardPrices> };

type SetFile = {
  data?: {
    cards?: Array<{
      uuid: string;
      identifiers?: { scryfallId?: string };
    }>;
  };
};

export class MtgjsonError extends Error {}

/** Pick the most recent dated value from a `{ "YYYY-MM-DD": price }` map. */
function latestPrice(points?: PricePoints): number | null {
  if (!points) return null;
  const dates = Object.keys(points);
  if (dates.length === 0) return null;
  dates.sort(); // ISO dates sort lexicographically
  const value = points[dates[dates.length - 1]];
  return Number.isFinite(value) ? value : null;
}

/** Best USD retail (normal, non-foil) price across the preferred providers. */
function usdRetail(card: CardPrices): number | null {
  const paper = card.paper;
  if (!paper) return null;
  for (const provider of USD_PROVIDERS) {
    const p = paper[provider];
    if (!p || (p.currency && p.currency !== "USD")) continue;
    const price = latestPrice(p.retail?.normal);
    if (price != null) return price;
  }
  return null;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new MtgjsonError(`${url} -> ${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

/**
 * Resolve Scryfall ids to MTGJSON uuids by reading the per-set files for the
 * sets involved. Sets that MTGJSON doesn't publish (or cards it lacks) are
 * silently skipped. Returns scryfallId -> uuid for everything matched.
 */
async function resolveUuids(
  cards: { id: string; setCode: string }[],
): Promise<Map<string, string>> {
  const bySet = new Map<string, Set<string>>();
  for (const c of cards) {
    const code = c.setCode.toUpperCase();
    const set = bySet.get(code) ?? new Set<string>();
    set.add(c.id);
    bySet.set(code, set);
  }

  const out = new Map<string, string>();
  for (const [code, wanted] of bySet) {
    let set: SetFile;
    try {
      set = await fetchJson<SetFile>(`${BASE}/${code}.json`);
    } catch {
      continue; // unknown set code on MTGJSON's side — leave those unpriced
    }
    for (const card of set.data?.cards ?? []) {
      const sid = card.identifiers?.scryfallId;
      if (sid && wanted.has(sid)) out.set(sid, card.uuid);
    }
    await new Promise((r) => setTimeout(r, 100)); // be polite between files
  }
  return out;
}

/** Download today's price snapshot and pull USD retail for the wanted uuids. */
async function fetchPricesByUuid(
  uuids: Set<string>,
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (uuids.size === 0) return out;

  const res = await fetch(`${BASE}/AllPricesToday.json.gz`, { cache: "no-store" });
  if (!res.ok) {
    throw new MtgjsonError(`AllPricesToday -> ${res.status} ${res.statusText}`);
  }
  const gz = Buffer.from(await res.arrayBuffer());
  const parsed = JSON.parse(gunzipSync(gz).toString("utf8")) as AllPricesToday;

  for (const uuid of uuids) {
    const card = parsed.data[uuid];
    if (!card) continue;
    const price = usdRetail(card);
    if (price != null) out.set(uuid, price);
  }
  return out;
}

export type MtgjsonPriceInput = {
  id: string; // scryfall id
  setCode: string;
  mtgjsonUuid: string | null; // cached uuid, if already known
};

export type MtgjsonPriceResult = {
  /** scryfallId -> USD price found in MTGJSON. */
  prices: Map<string, number>;
  /** Newly resolved scryfallId -> uuid mappings worth persisting. */
  resolvedUuids: Map<string, string>;
};

/**
 * Look up USD retail prices for the given Scryfall cards from MTGJSON. Resolves
 * any missing uuids via per-set files (returned so the caller can cache them),
 * then reads a single price snapshot.
 */
export async function getMtgjsonUsdPrices(
  cards: MtgjsonPriceInput[],
): Promise<MtgjsonPriceResult> {
  const needUuid = cards.filter((c) => !c.mtgjsonUuid);
  const resolvedUuids = needUuid.length
    ? await resolveUuids(needUuid)
    : new Map<string, string>();

  const uuidByScryfallId = new Map<string, string>();
  for (const c of cards) {
    const uuid = c.mtgjsonUuid ?? resolvedUuids.get(c.id);
    if (uuid) uuidByScryfallId.set(c.id, uuid);
  }

  const priceByUuid = await fetchPricesByUuid(new Set(uuidByScryfallId.values()));

  const prices = new Map<string, number>();
  for (const [sid, uuid] of uuidByScryfallId) {
    const price = priceByUuid.get(uuid);
    if (price != null) prices.set(sid, price);
  }

  return { prices, resolvedUuids };
}
