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
          {rows.map((r, i) => {
            const medal = ["🥇", "🥈", "🥉"][i];
            return (
            <tr
              key={r.userId}
              className={`border-b border-ink-800/60 last:border-0 hover:bg-ink-800/40 ${
                i % 2 ? "bg-ink-900/40" : ""
              } ${i === 0 ? "bg-brand-500/10" : ""}`}
            >
              <td className="px-3 py-2.5 text-center font-bold">
                {medal ? (
                  <span className="text-lg" title={`#${i + 1}`}>
                    {medal}
                  </span>
                ) : (
                  <span className="text-ink-400">{i + 1}</span>
                )}
              </td>
              <td className="px-3 py-2.5">
                <Link
                  href={`/players/${r.userId}`}
                  className="flex items-center gap-2 hover:underline"
                >
                  <Avatar name={r.userName} color={r.avatarColor} size={28} />
                  <span
                    className={`font-medium ${
                      i === 0
                        ? "font-display text-base text-brand-300 [text-shadow:1px_1px_0_#000]"
                        : ""
                    }`}
                  >
                    {r.userName}
                  </span>
                  {i === 0 && (
                    <span className="animate-blink text-[#ff4dff]" aria-hidden>
                      ◄ CHAMPION!
                    </span>
                  )}
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
