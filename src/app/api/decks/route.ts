import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handle, json } from "@/lib/api";
import { cardInputSchema, buildStates } from "@/lib/deckWrite";
import { syncDeckColorIdentity } from "@/lib/deck";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().min(1, "Give your deck a name").max(80),
  preconName: z.string().trim().max(80).optional().nullable(),
  sourceType: z.enum(["paste", "moxfield"]).default("paste"),
  sourceUrl: z.string().trim().url().optional().nullable(),
  cards: z.array(cardInputSchema).min(1, "Add at least one card"),
});

export const POST = handle(async (req: Request) => {
  const me = await requireUser();
  const body = schema.parse(await req.json());

  // The original import defines the immutable baseline (everything is "free").
  const baselineIds = new Set(body.cards.map((c) => c.cardId));
  // Validates that every card id resolved through Scryfall.
  await buildStates(body.cards, baselineIds);

  const deck = await prisma.deck.create({
    data: {
      name: body.name,
      preconName: body.preconName ?? null,
      ownerId: me.id,
      sourceType: body.sourceType,
      sourceUrl: body.sourceUrl ?? null,
      baselineCardIds: Array.from(baselineIds),
      cards: {
        create: body.cards.map((c) => ({
          cardId: c.cardId,
          quantity: c.quantity,
          isCommander: c.isCommander,
          isBaseline: true,
        })),
      },
    },
  });

  await syncDeckColorIdentity(deck.id);
  return json({ id: deck.id });
});
