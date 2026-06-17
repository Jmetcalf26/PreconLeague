import { requirePageUser } from "@/lib/page";
import { getLeague } from "@/lib/league";
import { DeckImport } from "@/components/DeckImport";
import { usd } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function NewDeckPage() {
  await requirePageUser();
  const league = await getLeague();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Import a deck</h1>
        <p className="mt-1 text-sm text-ink-400">
          Every card is matched against Scryfall for art, color identity and
          pricing. This list becomes your baseline precon — you then have{" "}
          {usd(league.upgradeBudgetUsd)} of upgrades to make.
        </p>
      </div>
      <DeckImport />
    </div>
  );
}
