import Link from "next/link";
import { requirePageUser } from "@/lib/page";
import { getLeague } from "@/lib/league";
import { getDeckTiles } from "@/lib/queries";
import { DeckCardTile } from "@/components/DeckCardTile";

export const dynamic = "force-dynamic";

export default async function DecksPage() {
  await requirePageUser();
  const [league, decks] = await Promise.all([getLeague(), getDeckTiles()]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">League decks</h1>
          <p className="mt-1 text-sm text-ink-400">
            {decks.length} deck{decks.length === 1 ? "" : "s"} across the league.
          </p>
        </div>
        <Link href="/decks/new" className="btn-primary">
          + Import deck
        </Link>
      </div>

      {decks.length === 0 ? (
        <div className="card-panel p-10 text-center text-ink-300">
          No decks yet. Be the first to{" "}
          <Link href="/decks/new" className="text-brand-400 hover:underline">
            import a precon
          </Link>
          .
        </div>
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
    </div>
  );
}
