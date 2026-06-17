import { notFound, redirect } from "next/navigation";
import { requirePageUser } from "@/lib/page";
import { prisma } from "@/lib/prisma";
import { getLeague, leagueToRules } from "@/lib/league";
import { deckWithCards } from "@/lib/deck";
import { DeckEditor, type EditorCard } from "@/components/DeckEditor";
import { usd } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EditDeckPage({
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
  if (deck.ownerId !== me.id && !me.isAdmin) redirect(`/decks/${deck.id}`);

  const league = await getLeague();

  const initialCards: EditorCard[] = deck.cards.map((dc) => ({
    cardId: dc.card.id,
    name: dc.card.name,
    quantity: dc.quantity,
    isCommander: dc.isCommander,
    typeLine: dc.card.typeLine,
    manaValue: dc.card.manaValue,
    colorIdentity: dc.card.colorIdentity,
    priceUsd: dc.card.priceUsd,
    imageNormal: dc.card.imageNormal,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Editing “{deck.name}”</h1>
        <p className="mt-1 text-sm text-ink-400">
          Add or swap cards within the {usd(league.upgradeBudgetUsd)} upgrade
          budget. Removing original precon cards is free; new cards count toward
          the budget at their Scryfall price.
        </p>
      </div>
      <DeckEditor
        deckId={deck.id}
        deckName={deck.name}
        initialCards={initialCards}
        baselineCardIds={deck.baselineCardIds}
        rules={leagueToRules(league)}
      />
    </div>
  );
}
