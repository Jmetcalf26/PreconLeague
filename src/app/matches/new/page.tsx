import Link from "next/link";
import { requirePageUser } from "@/lib/page";
import { prisma } from "@/lib/prisma";
import { MatchForm } from "@/components/MatchForm";

export const dynamic = "force-dynamic";

export default async function NewMatchPage() {
  await requirePageUser();

  const players = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      decks: {
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      },
    },
  });

  const withDecks = players.filter((p) => p.decks.length > 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Record a game</h1>
        <p className="mt-1 text-sm text-ink-400">
          Log who played which deck and how they finished. Standings update
          automatically.
        </p>
      </div>

      {withDecks.length < 2 ? (
        <div className="card-panel p-8 text-center text-ink-300">
          You need at least two players with decks before recording a game.{" "}
          <Link href="/decks/new" className="text-brand-400 hover:underline">
            Import a deck
          </Link>
          .
        </div>
      ) : (
        <MatchForm players={withDecks} />
      )}
    </div>
  );
}
