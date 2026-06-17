import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePageUser } from "@/lib/page";
import { prisma } from "@/lib/prisma";
import { getLeague, leagueToRules } from "@/lib/league";
import { deckWithCards, toDeckCardStates, summarizeDeck } from "@/lib/deck";
import { validateDeck } from "@/lib/validation";
import { Avatar } from "@/components/Avatar";
import { ColorPips } from "@/components/ColorPips";
import { CardThumb } from "@/components/CardThumb";
import { DeckCardsView, type DeckViewCard } from "@/components/DeckCardsView";
import { ValidationSummary } from "@/components/ValidationSummary";
import { DeckActions } from "@/components/DeckActions";
import { usd } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DeckPage({
  params,
}: {
  params: { id: string };
}) {
  const me = await requirePageUser();

  const deck = await prisma.deck.findUnique({
    where: { id: params.id },
    ...deckWithCards,
  });
  if (!deck) notFound();

  const league = await getLeague();
  const validation = validateDeck(
    toDeckCardStates(deck),
    leagueToRules(league),
  );
  const summary = summarizeDeck(deck);
  const canEdit = deck.ownerId === me.id || me.isAdmin;

  const commander = deck.cards.find((c) => c.isCommander)?.card ?? null;

  const viewCards: DeckViewCard[] = deck.cards.map((dc) => ({
    id: dc.id,
    name: dc.card.name,
    quantity: dc.quantity,
    isCommander: dc.isCommander,
    isBaseline: dc.isBaseline,
    typeLine: dc.card.typeLine,
    manaValue: dc.card.manaValue,
    colorIdentity: dc.card.colorIdentity,
    priceUsd: dc.card.priceUsd,
    imageNormal: dc.card.imageNormal,
    scryfallUri: dc.card.scryfallUri,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="card-panel overflow-hidden">
        <div className="flex flex-col gap-6 p-6 md:flex-row">
          <div className="w-40 shrink-0 self-center md:self-start">
            <CardThumb
              name={commander?.name ?? deck.name}
              image={commander?.imageNormal ?? null}
              className="aspect-[5/7] w-full"
            />
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <ColorPips colors={deck.colorIdentity} />
                </div>
                <h1 className="mt-2 text-2xl font-bold">{deck.name}</h1>
                {commander && (
                  <p className="text-ink-400">Commander: {commander.name}</p>
                )}
              </div>
              {canEdit && <DeckActions deckId={deck.id} />}
            </div>

            <Link
              href={`/players/${deck.owner.id}`}
              className="inline-flex items-center gap-2 text-sm text-ink-300 hover:underline"
            >
              <Avatar name={deck.owner.name} color={deck.owner.avatarColor} size={24} />
              {deck.owner.name}
            </Link>

            <div className="grid grid-cols-3 gap-3 pt-2 text-sm">
              <Stat label="Cards" value={`${summary.cardCount}`} />
              <Stat label="Total value" value={usd(summary.totalValueUsd)} />
              <Stat
                label="Upgrades"
                value={`${usd(summary.upgradeValueUsd)} / ${usd(league.upgradeBudgetUsd)}`}
                warn={summary.upgradeValueUsd > league.upgradeBudgetUsd}
              />
            </div>
            {deck.sourceUrl && (
              <a
                href={deck.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-xs text-brand-400 hover:underline"
              >
                Imported from Moxfield ↗
              </a>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DeckCardsView cards={viewCards} />
        </div>
        <div className="space-y-4">
          <ValidationSummary validation={validation} />
          {canEdit && !validation.ok && (
            <div className="card-panel p-4 text-sm text-ink-300">
              This deck currently breaks a rule.{" "}
              <Link
                href={`/decks/${deck.id}/edit`}
                className="text-brand-400 hover:underline"
              >
                Fix it in the editor →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-lg border border-ink-800 bg-ink-950/40 px-3 py-2">
      <div className={`font-semibold ${warn ? "text-red-400" : "text-ink-100"}`}>
        {value}
      </div>
      <div className="text-xs uppercase tracking-wide text-ink-500">{label}</div>
    </div>
  );
}
