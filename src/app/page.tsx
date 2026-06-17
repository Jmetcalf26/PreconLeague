import Link from "next/link";
import { requirePageUser } from "@/lib/page";
import { prisma } from "@/lib/prisma";
import { getLeague } from "@/lib/league";
import { getStandings, getDeckTiles } from "@/lib/queries";
import { StandingsTable } from "@/components/StandingsTable";
import { DeckCardTile } from "@/components/DeckCardTile";
import { MatchRow } from "@/components/MatchRow";
import { usd } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await requirePageUser();

  const [league, standings, myDecks, recentMatches, counts] = await Promise.all([
    getLeague(),
    getStandings(),
    getDeckTiles(user.id),
    prisma.match.findMany({
      orderBy: { playedAt: "desc" },
      take: 5,
      include: {
        players: {
          orderBy: { placement: "asc" },
          include: { user: { select: { id: true, name: true, avatarColor: true } } },
        },
      },
    }),
    Promise.all([prisma.deck.count(), prisma.match.count(), prisma.user.count()]),
  ]);

  const [deckCount, matchCount, playerCount] = counts;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="card-panel overflow-hidden">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-brand-400">{league.name}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Welcome back, {user.name.split(" ")[0]}.
            </h1>
            <p className="mt-2 max-w-xl text-sm text-ink-400">
              {league.description ??
                `Upgrade your precon within a ${usd(league.upgradeBudgetUsd)} budget, battle in four-player pods, and climb the standings.`}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/decks/new" className="btn-primary">
              Import a deck
            </Link>
            <Link href="/matches/new" className="btn-secondary">
              Record a game
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-ink-800 border-t border-ink-800 text-center">
          <Stat label="Players" value={playerCount} />
          <Stat label="Decks" value={deckCount} />
          <Stat label="Games played" value={matchCount} />
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Standings</h2>
            <Link href="/standings" className="text-sm text-brand-400 hover:underline">
              Full table →
            </Link>
          </div>
          <div className="card-panel">
            <StandingsTable rows={standings.slice(0, 8)} compact />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent games</h2>
            <Link href="/matches" className="text-sm text-brand-400 hover:underline">
              All →
            </Link>
          </div>
          <div className="card-panel divide-y divide-ink-800">
            {recentMatches.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-ink-400">
                No games yet.{" "}
                <Link href="/matches/new" className="text-brand-400 hover:underline">
                  Record one
                </Link>
                .
              </p>
            ) : (
              recentMatches.map((m) => <MatchRow key={m.id} match={m} />)
            )}
          </div>
        </section>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your decks</h2>
          <Link href="/decks" className="text-sm text-brand-400 hover:underline">
            Browse all decks →
          </Link>
        </div>
        {myDecks.length === 0 ? (
          <div className="card-panel p-8 text-center">
            <p className="text-ink-300">You haven&apos;t added a deck yet.</p>
            <Link href="/decks/new" className="btn-primary mt-4">
              Import your precon
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myDecks.map((deck) => (
              <DeckCardTile
                key={deck.id}
                deck={deck}
                budget={league.upgradeBudgetUsd}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-4 py-4">
      <div className="text-2xl font-bold text-ink-50">{value}</div>
      <div className="text-xs uppercase tracking-wide text-ink-400">{label}</div>
    </div>
  );
}
