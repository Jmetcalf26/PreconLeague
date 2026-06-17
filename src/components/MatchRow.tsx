import Link from "next/link";
import { Avatar } from "./Avatar";
import { formatDate, ordinal } from "@/lib/format";

export type MatchRowData = {
  id: string;
  playedAt: Date | string;
  players: {
    placement: number;
    deckName: string;
    user: { id: string; name: string; avatarColor: string };
  }[];
};

export function MatchRow({ match }: { match: MatchRowData }) {
  const ordered = [...match.players].sort((a, b) => a.placement - b.placement);
  const winner = ordered[0];

  return (
    <Link
      href={`/matches/${match.id}`}
      className="block px-4 py-3 transition-colors hover:bg-ink-800/40"
    >
      <div className="mb-2 flex items-center justify-between text-xs text-ink-400">
        <span>{formatDate(match.playedAt)}</span>
        <span>{match.players.length}-player pod</span>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {ordered.map((p) => (
          <span
            key={p.user.id}
            className={`flex items-center gap-1.5 text-sm ${
              p.placement === 1 ? "font-semibold text-ink-50" : "text-ink-300"
            }`}
            title={`${p.user.name} — ${ordinal(p.placement)} (${p.deckName})`}
          >
            <Avatar name={p.user.name} color={p.user.avatarColor} size={22} />
            {p.user.name}
            {p.placement === 1 && (
              <span className="chip bg-brand-500/20 text-brand-300">🏆 Win</span>
            )}
          </span>
        ))}
      </div>
      {winner && (
        <p className="mt-1.5 truncate text-xs text-ink-500">
          {winner.user.name} won with {winner.deckName}
        </p>
      )}
    </Link>
  );
}
