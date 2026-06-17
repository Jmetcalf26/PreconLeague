import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePageUser } from "@/lib/page";
import { prisma } from "@/lib/prisma";
import { getLeague } from "@/lib/league";
import { getDeckTiles } from "@/lib/queries";
import { Avatar } from "@/components/Avatar";
import { DeckCardTile } from "@/components/DeckCardTile";
import { MatchRow } from "@/components/MatchRow";
import { ordinal } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PlayerPage({
  params,
}: {
  params: { id: string };
}) {
  const me = await requirePageUser();

  const player = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      avatarColor: true,
      bio: true,
      isAdmin: true,
      createdAt: true,
    },
  });
  if (!player) notFound();

  const [league, decks, matchPlayers] = await Promise.all([
    getLeague(),
    getDeckTiles(player.id),
    prisma.matchPlayer.findMany({
      where: { userId: player.id },
      include: {
        match: {
          include: {
            players: {
              orderBy: { placement: "asc" },
              include: {
                user: { select: { id: true, name: true, avatarColor: true } },
              },
            },
          },
        },
      },
      orderBy: { match: { playedAt: "desc" } },
      take: 10,
    }),
  ]);

  const games = matchPlayers.length;
  const wins = matchPlayers.filter((mp) => mp.placement === 1).length;
  const avgPlace = games
    ? matchPlayers.reduce((s, mp) => s + mp.placement, 0) / games
    : 0;
  const isMe = me.id === player.id;

  return (
    <div className="space-y-8">
      <section className="card-panel flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={player.name} color={player.avatarColor} size={64} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{player.name}</h1>
              {player.isAdmin && (
                <span className="chip bg-brand-500/20 text-brand-300">Admin</span>
              )}
            </div>
            {player.bio && (
              <p className="mt-1 max-w-md text-sm text-ink-400">{player.bio}</p>
            )}
          </div>
        </div>
        <div className="flex gap-6 text-center">
          <Mini label="Games" value={`${games}`} />
          <Mini label="Wins" value={`${wins}`} />
          <Mini
            label="Avg place"
            value={avgPlace ? ordinal(Math.round(avgPlace)) : "—"}
          />
          {isMe && (
            <Link href="/profile" className="btn-secondary self-center">
              Edit profile
            </Link>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {isMe ? "Your decks" : `${player.name.split(" ")[0]}'s decks`}
          </h2>
          {isMe && (
            <Link href="/decks/new" className="text-sm text-brand-400 hover:underline">
              + Import deck
            </Link>
          )}
        </div>
        {decks.length === 0 ? (
          <p className="card-panel p-6 text-center text-sm text-ink-400">
            No decks yet.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {decks.map((deck) => (
              <DeckCardTile
                key={deck.id}
                deck={deck}
                budget={league.upgradeBudgetUsd}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Recent games</h2>
        {matchPlayers.length === 0 ? (
          <p className="card-panel p-6 text-center text-sm text-ink-400">
            No games recorded.
          </p>
        ) : (
          <div className="card-panel divide-y divide-ink-800">
            {matchPlayers.map((mp) => (
              <MatchRow key={mp.id} match={mp.match} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xl font-bold text-ink-50">{value}</div>
      <div className="text-xs uppercase tracking-wide text-ink-400">{label}</div>
    </div>
  );
}
