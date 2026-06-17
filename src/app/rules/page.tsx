import Link from "next/link";
import { requirePageUser } from "@/lib/page";
import { getLeague } from "@/lib/league";
import { usd } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function RulesPage() {
  const user = await requirePageUser();
  const league = await getLeague();

  const rules: { label: string; value: string; on?: boolean }[] = [
    {
      label: "Upgrade budget",
      value: `${usd(league.upgradeBudgetUsd)} of changes beyond the original precon`,
    },
    {
      label: "Color identity lock",
      value: league.enforceColorIdentity
        ? "Cards must match the commander's color identity"
        : "Not enforced",
      on: league.enforceColorIdentity,
    },
    {
      label: "Singleton",
      value: league.enforceSingleton
        ? "One of each card (basic lands exempt)"
        : "Not enforced",
      on: league.enforceSingleton,
    },
    {
      label: "Commander required",
      value: league.requireCommander ? "Every deck needs a commander" : "Optional",
      on: league.requireCommander,
    },
    {
      label: "Deck size",
      value:
        league.minDeckSize === league.maxDeckSize
          ? `Exactly ${league.minDeckSize} cards`
          : `${league.minDeckSize}–${league.maxDeckSize} cards`,
    },
    {
      label: "Scoring",
      value: league.placementPoints
        .map((p, i) => `${i + 1}${["st", "nd", "rd"][i] ?? "th"}: ${p} pt${p === 1 ? "" : "s"}`)
        .join(" · "),
    },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">League rules</h1>
        {user.isAdmin && (
          <Link href="/admin" className="btn-secondary">
            Edit rules
          </Link>
        )}
      </div>

      {league.description && (
        <p className="card-panel p-4 text-sm text-ink-300">{league.description}</p>
      )}

      <div className="card-panel divide-y divide-ink-800">
        {rules.map((r) => (
          <div key={r.label} className="flex items-start justify-between gap-4 p-4">
            <span className="font-medium text-ink-100">{r.label}</span>
            <span className="text-right text-sm text-ink-300">{r.value}</span>
          </div>
        ))}
      </div>

      {league.bannedCards.length > 0 && (
        <div className="card-panel p-4">
          <h2 className="mb-2 font-medium">Banned cards</h2>
          <div className="flex flex-wrap gap-2">
            {league.bannedCards.map((c) => (
              <span key={c} className="chip bg-red-950/50 text-red-300">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-ink-500">
        Upgrade costs are calculated from live Scryfall prices. Removing original
        precon cards is always free; only cards you add count against the budget.
      </p>
    </div>
  );
}
