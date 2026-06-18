import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { refreshCards } from "@/lib/scryfall";
import { handle, json } from "@/lib/api";

export const dynamic = "force-dynamic";

// Re-fetch Scryfall data/prices for every card currently used in a deck.
export const POST = handle(async () => {
  await requireAdmin();
  const used = await prisma.deckCard.findMany({
    distinct: ["cardId"],
    select: { cardId: true },
  });
  const ids = used.map((u) => u.cardId);
  const result = await refreshCards(ids);
  return json({ ok: true, ...result });
});
