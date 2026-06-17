import "server-only";
import type { ParsedDecklist, ParsedLine } from "./decklist";

/** Pull the public deck id out of a Moxfield URL or accept a bare id. */
export function extractMoxfieldId(input: string): string | null {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/moxfield\.com\/decks\/([A-Za-z0-9_-]+)/i);
  if (urlMatch) return urlMatch[1];
  // bare id (Moxfield public ids are short slugs)
  if (/^[A-Za-z0-9_-]{3,}$/.test(trimmed) && !trimmed.includes("/")) {
    return trimmed;
  }
  return null;
}

type MoxfieldCardEntry = {
  quantity: number;
  card?: { name?: string };
};

type MoxfieldDeck = {
  name?: string;
  boards?: {
    mainboard?: { cards?: Record<string, MoxfieldCardEntry> };
    commanders?: { cards?: Record<string, MoxfieldCardEntry> };
  };
  // older shape
  mainboard?: Record<string, MoxfieldCardEntry>;
  commanders?: Record<string, MoxfieldCardEntry>;
};

export type MoxfieldImport = {
  deckName: string | null;
  decklist: ParsedDecklist;
};

function collect(
  cards: Record<string, MoxfieldCardEntry> | undefined,
  isCommander: boolean,
): ParsedLine[] {
  if (!cards) return [];
  const out: ParsedLine[] = [];
  for (const entry of Object.values(cards)) {
    const name = entry.card?.name;
    if (!name) continue;
    out.push({ quantity: entry.quantity ?? 1, name, isCommander });
  }
  return out;
}

/**
 * Best-effort fetch of a public Moxfield deck. Moxfield's API frequently
 * blocks server-side requests; callers should fall back to paste import when
 * this throws.
 */
export async function fetchMoxfieldDeck(input: string): Promise<MoxfieldImport> {
  const id = extractMoxfieldId(input);
  if (!id) {
    throw new MoxfieldError(
      "That doesn't look like a Moxfield deck link. Paste a URL like https://www.moxfield.com/decks/abc123",
    );
  }

  let res: Response;
  try {
    res = await fetch(`https://api2.moxfield.com/v3/decks/all/${id}`, {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (compatible; PreconLeague/1.0; +https://github.com/jmetcalf26/preconleague)",
      },
      cache: "no-store",
    });
  } catch {
    throw new MoxfieldError(
      "Couldn't reach Moxfield. Paste your decklist instead.",
    );
  }

  if (!res.ok) {
    throw new MoxfieldError(
      res.status === 403 || res.status === 401
        ? "Moxfield blocked the import (this happens often). Open your deck on Moxfield, choose Export → plain text, and paste it instead."
        : `Moxfield returned ${res.status}. Try pasting your decklist instead.`,
    );
  }

  const deck = (await res.json()) as MoxfieldDeck;

  const commanders = [
    ...collect(deck.boards?.commanders?.cards, true),
    ...collect(deck.commanders, true),
  ];
  const mainboard = [
    ...collect(deck.boards?.mainboard?.cards, false),
    ...collect(deck.mainboard, false),
  ];

  const cards = [...commanders, ...mainboard];
  if (cards.length === 0) {
    throw new MoxfieldError(
      "That Moxfield deck looks empty or private. Paste your decklist instead.",
    );
  }

  return {
    deckName: deck.name ?? null,
    decklist: { cards, warnings: [] },
  };
}

export class MoxfieldError extends Error {}
