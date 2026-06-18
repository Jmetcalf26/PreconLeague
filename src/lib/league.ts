import "server-only";
import { prisma } from "./prisma";
import type { League } from "@prisma/client";
import type { RuleConfig } from "./validation";

const LEAGUE_ID = "league";

/** Fetch the single league config row, creating it with defaults if missing. */
export async function getLeague(): Promise<League> {
  const existing = await prisma.league.findUnique({ where: { id: LEAGUE_ID } });
  if (existing) return existing;
  return prisma.league.create({ data: { id: LEAGUE_ID } });
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
