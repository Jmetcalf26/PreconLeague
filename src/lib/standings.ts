export type StandingMatchPlayer = {
  userId: string;
  userName: string;
  avatarColor: string;
  placement: number;
};

export type StandingRow = {
  userId: string;
  userName: string;
  avatarColor: string;
  games: number;
  wins: number;
  points: number;
  avgPlacement: number;
  winRate: number;
};

/**
 * Compute league standings from a flat list of match-player rows.
 * `placementPoints[0]` is awarded for 1st place, `[1]` for 2nd, etc.
 */
export function computeStandings(
  rows: StandingMatchPlayer[],
  placementPoints: number[],
): StandingRow[] {
  const byUser = new Map<string, StandingRow & { placementSum: number }>();

  for (const row of rows) {
    let agg = byUser.get(row.userId);
    if (!agg) {
      agg = {
        userId: row.userId,
        userName: row.userName,
        avatarColor: row.avatarColor,
        games: 0,
        wins: 0,
        points: 0,
        avgPlacement: 0,
        winRate: 0,
        placementSum: 0,
      };
      byUser.set(row.userId, agg);
    }
    agg.games += 1;
    agg.placementSum += row.placement;
    if (row.placement === 1) agg.wins += 1;
    agg.points += placementPoints[row.placement - 1] ?? 0;
  }

  const out: StandingRow[] = [];
  for (const agg of byUser.values()) {
    const { placementSum, ...rest } = agg;
    out.push({
      ...rest,
      avgPlacement: agg.games ? placementSum / agg.games : 0,
      winRate: agg.games ? agg.wins / agg.games : 0,
    });
  }

  out.sort(
    (a, b) =>
      b.points - a.points ||
      b.wins - a.wins ||
      a.avgPlacement - b.avgPlacement ||
      a.userName.localeCompare(b.userName),
  );

  return out;
}
