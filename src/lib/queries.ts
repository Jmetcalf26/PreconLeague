import "server-only";
import { prisma } from "./prisma";
import { getLeague } from "./league";
import { computeStandings, type StandingRow } from "./standings";
import { deckWithCards, summarizeDeck } from "./deck";
import type { DeckTileData } from "@/components/DeckCardTile";

/** Compute current league standings from all recorded matches. */
export async function getStandings(): Promise<StandingRow[]> {
  const [league, players] = await Promise.all([
    getLeague(),
    prisma.matchPlayer.findMany({
      select: {
        placement: true,
        user: { select: { id: true, name: true, avatarColor: true } },
      },
    }),
  ]);

  return computeStandings(
    players.map((p) => ({
      userId: p.user.id,
      userName: p.user.name,
      avatarColor: p.user.avatarColor,
      placement: p.placement,
    })),
    league.placementPoints,
  );
}

/** Load deck summary tiles, optionally filtered to one owner. */
export async function getDeckTiles(ownerId?: string): Promise<DeckTileData[]> {
  const decks = await prisma.deck.findMany({
    where: ownerId ? { ownerId } : undefined,
    orderBy: { updatedAt: "desc" },
    ...deckWithCards,
  });

  return decks.map((deck) => {
    const summary = summarizeDeck(deck);
    const commander = deck.cards.find((c) => c.isCommander)?.card ?? null;
    return {
      id: deck.id,
      name: deck.name,
      preconName: deck.preconName,
      colorIdentity: deck.colorIdentity,
      cardCount: summary.cardCount,
      totalValueUsd: summary.totalValueUsd,
      upgradeValueUsd: summary.upgradeValueUsd,
      commanderName: commander?.name ?? null,
      commanderArt: commander?.imageArtCrop ?? null,
      owner: deck.owner,
    };
  });
}
