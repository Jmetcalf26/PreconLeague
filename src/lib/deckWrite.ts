import "server-only";
import { z } from "zod";
import { prisma } from "./prisma";
import { validateDeck, type DeckCardState } from "./validation";
import { getLeague, leagueToRules } from "./league";

export const cardInputSchema = z.object({
  cardId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
  isCommander: z.boolean().default(false),
});

export type CardInput = z.infer<typeof cardInputSchema>;

/**
 * Load the CardCache rows for the given inputs and build the normalized state
 * used for validation. Throws if any card id is unknown (i.e. never resolved
 * through Scryfall).
 */
export async function buildStates(
  cards: CardInput[],
  baselineIds: Set<string>,
): Promise<DeckCardState[]> {
  const ids = cards.map((c) => c.cardId);
  const cached = await prisma.cardCache.findMany({ where: { id: { in: ids } } });
  const byId = new Map(cached.map((c) => [c.id, c]));

  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length > 0) {
    throw new DeckWriteError(
      "Some cards couldn't be found. Please remove and re-add them.",
    );
  }

  return cards.map((c) => {
    const card = byId.get(c.cardId)!;
    return {
      name: card.name,
      quantity: c.quantity,
      isCommander: c.isCommander,
      isBaseline: baselineIds.has(c.cardId),
      typeLine: card.typeLine,
      colorIdentity: card.colorIdentity,
      priceUsd: card.priceUsd,
    };
  });
}

export async function validateCardInputs(
  cards: CardInput[],
  baselineIds: Set<string>,
) {
  const league = await getLeague();
  const states = await buildStates(cards, baselineIds);
  return validateDeck(states, leagueToRules(league));
}

/** Replace all cards in a deck, stamping isBaseline from the deck's snapshot. */
export async function writeDeckCards(
  deckId: string,
  baselineIds: Set<string>,
  cards: CardInput[],
): Promise<void> {
  await prisma.$transaction([
    prisma.deckCard.deleteMany({ where: { deckId } }),
    prisma.deckCard.createMany({
      data: cards.map((c) => ({
        deckId,
        cardId: c.cardId,
        quantity: c.quantity,
        isCommander: c.isCommander,
        isBaseline: baselineIds.has(c.cardId),
      })),
    }),
  ]);
}

export class DeckWriteError extends Error {}
