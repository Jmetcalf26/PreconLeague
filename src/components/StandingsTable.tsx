import Link from "next/link";
import { Avatar } from "./Avatar";
import { ordinal } from "@/lib/format";
import type { StandingRow } from "@/lib/standings";

export function StandingsTable({
  rows,
  compact = false,
}: {
  rows: StandingRow[];
  compact?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <p className="px-4 py-6 text-center text-sm text-ink-400">
        No games recorded yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink-800 text-left text-xs uppercase tracking-wide text-ink-400">
            <th className="px-3 py-2 font-medium">#</th>
            <th className="px-3 py-2 font-medium">Player</th>
            <th className="px-3 py-2 text-right font-medium">Pts</th>
            <th className="px-3 py-2 text-right font-medium">W</th>
            <th className="px-3 py-2 text-right font-medium">GP</th>
            {!compact && (
              <>
                <th className="px-3 py-2 text-right font-medium">Win %</th>
                <th className="px-3 py-2 text-right font-medium">Avg place</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.userId}
              className="border-b border-ink-800/60 last:border-0 hover:bg-ink-800/40"
            >
              <td className="px-3 py-2.5 font-semibold text-ink-400">{i + 1}</td>
              <td className="px-3 py-2.5">
                <Link
                  href={`/players/${r.userId}`}
                  className="flex items-center gap-2 hover:underline"
                >
                  <Avatar name={r.userName} color={r.avatarColor} size={28} />
                  <span className="font-medium">{r.userName}</span>
                </Link>
              </td>
              <td className="px-3 py-2.5 text-right font-bold text-brand-400">
                {r.points}
              </td>
              <td className="px-3 py-2.5 text-right">{r.wins}</td>
              <td className="px-3 py-2.5 text-right text-ink-300">{r.games}</td>
              {!compact && (
                <>
                  <td className="px-3 py-2.5 text-right text-ink-300">
                    {Math.round(r.winRate * 100)}%
                  </td>
                  <td className="px-3 py-2.5 text-right text-ink-300">
                    {r.avgPlacement ? ordinal(Math.round(r.avgPlacement)) : "—"}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
