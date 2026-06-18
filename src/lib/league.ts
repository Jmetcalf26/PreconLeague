import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import type { League } from "@prisma/client";
import type { RuleConfig } from "./validation";

const LEAGUE_ID = "league";

/** Fetch the single league config row, creating it with defaults if missing. */
export async function getLeague(): Promise<League> {
  const existing = await prisma.league.findUnique({ where: { id: LEAGUE_ID } });
  if (existing) return existing;
  // First-boot race: several requests can all see "no row" at once and each
  // try to create it. Only one INSERT wins the unique constraint; the rest
  // catch P2002 and re-read the row the winner just created.
  try {
    return await prisma.league.create({ data: { id: LEAGUE_ID } });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const row = await prisma.league.findUnique({ where: { id: LEAGUE_ID } });
      if (row) return row;
    }
    throw err;
  }
}

export function leagueToRules(league: League): RuleConfig {
  return {
    upgradeBudgetUsd: league.upgradeBudgetUsd,
    enforceColorIdentity: league.enforceColorIdentity,
    enforceSingleton: league.enforceSingleton,
    requireCommander: league.requireCommander,
    minDeckSize: league.minDeckSize,
    maxDeckSize: league.maxDeckSize,
    bannedCards: league.bannedCards,
    enforceMaxChanges: league.enforceMaxChanges,
    maxLandChanges: league.maxLandChanges,
    maxNonlandChanges: league.maxNonlandChanges,
  };
}
