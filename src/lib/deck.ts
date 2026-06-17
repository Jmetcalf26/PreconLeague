import "server-only";
import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";
import type { DeckCardState } from "./validation";

export const deckWithCards = {
  include: {
    owner: {
      select: { id: true, name: true, avatarColor: true },
    },
    cards: {
      include: { card: true },
      orderBy: { card: { name: "asc" } },
    },
  },
} satisfies Prisma.DeckDefaultArgs;

export type DeckWithCards = Prisma.DeckGetPayload<typeof deckWithCards>;

/** Build the normalized state array used by the validation engine. */
export function toDeckCardStates(deck: DeckWithCards): DeckCardState[] {
  return deck.cards.map((dc) => ({
    name: dc.card.name,
    quantity: dc.quantity,
    isCommander: dc.isCommander,
    isBaseline: dc.isBaseline,
    typeLine: dc.card.typeLine,
    colorIdentity: dc.card.colorIdentity,
    priceUsd: dc.card.priceUsd,
  }));
}

export type DeckSummary = {
  cardCount: number;
  totalValueUsd: number;
  upgradeValueUsd: number;
  colorIdentity: string[];
};

/** Aggregate totals for display (counts, total value, upgrade spend). */
export function summarizeDeck(deck: DeckWithCards): DeckSummary {
  let cardCount = 0;
  let totalValueUsd = 0;
  let upgradeValueUsd = 0;
  const colors = new Set<string>();

  for (const dc of deck.cards) {
    cardCount += dc.quantity;
    const price = dc.card.priceUsd ?? 0;
    totalValueUsd += price * dc.quantity;
    if (!dc.isBaseline) upgradeValueUsd += price * dc.quantity;
    for (const c of dc.card.colorIdentity) colors.add(c);
  }

  return {
    cardCount,
    totalValueUsd: Math.round(totalValueUsd * 100) / 100,
    upgradeValueUsd: Math.round(upgradeValueUsd * 100) / 100,
    colorIdentity: Array.from(colors).sort(),
  };
}

/** Recompute and persist a deck's color identity from its commander(s). */
export async function syncDeckColorIdentity(deckId: string): Promise<void> {
  const cards = await prisma.deckCard.findMany({
    where: { deckId, isCommander: true },
    include: { card: true },
  });
  const colors = new Set<string>();
  for (const dc of cards) for (const c of dc.card.colorIdentity) colors.add(c);
  await prisma.deck.update({
    where: { id: deckId },
    data: { colorIdentity: Array.from(colors).sort() },
  });
}
