import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePageUser } from "@/lib/page";
import { prisma } from "@/lib/prisma";
import { getLeague } from "@/lib/league";
import { Avatar } from "@/components/Avatar";
import { DeleteButton } from "@/components/DeleteButton";
import { formatDate, ordinal } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MatchPage({
  params,
}: {
  params: { id: string };
}) {
  const me = await requirePageUser();

  const [match, league] = await Promise.all([
    prisma.match.findUnique({
      where: { id: params.id },
      include: {
        createdBy: { select: { name: true } },
        players: {
          orderBy: { placement: "asc" },
          include: {
            user: { select: { id: true, name: true, avatarColor: true } },
            deck: { select: { id: true } },
          },
        },
      },
    }),
    getLeague(),
  ]);
  if (!match) notFound();

  const canDelete = match.createdById === me.id || me.isAdmin;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/matches" className="text-sm text-brand-400 hover:underline">
            ← All matches
          </Link>
          <h1 className="mt-1 text-2xl font-bold">
            {match.players.length}-player game
          </h1>
          <p className="text-sm text-ink-400">
            {formatDate(match.playedAt)} · recorded by {match.createdBy.name}
          </p>
        </div>
        {canDelete && (
          <DeleteButton
            url={`/api/matches/${match.id}`}
            redirectTo="/matches"
            confirmText="Delete this match? Standings will update."
          />
        )}
      </div>

      {match.notes && (
        <p className="card-panel p-4 text-sm text-ink-300">{match.notes}</p>
      )}

      <div className="card-panel divide-y divide-ink-800">
        {match.players.map((p) => {
          const pts = league.placementPoints[p.placement - 1] ?? 0;
          return (
            <div key={p.id} className="flex items-center gap-3 p-4">
              <span
                className={`grid h-9 w-9 place-items-center rounded-full text-sm font-bold ${
                  p.placement === 1
                    ? "bg-brand-500 text-white"
                    : "bg-ink-800 text-ink-300"
                }`}
              >
                {p.placement}
              </span>
              <Avatar name={p.user.name} color={p.user.avatarColor} size={36} />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/players/${p.user.id}`}
                  className="font-semibold hover:underline"
                >
                  {p.user.name}
                </Link>
                <div className="truncate text-xs text-ink-400">
                  {p.deck ? (
                    <Link
                      href={`/decks/${p.deck.id}`}
                      className="hover:text-brand-300 hover:underline"
                    >
                      {p.deckName}
                    </Link>
                  ) : (
                    p.deckName
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{ordinal(p.placement)}</div>
                <div className="text-xs text-brand-400">+{pts} pts</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
