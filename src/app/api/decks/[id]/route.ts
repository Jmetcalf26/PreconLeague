import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handle, json } from "@/lib/api";
import {
  cardInputSchema,
  validateCardInputs,
  writeDeckCards,
} from "@/lib/deckWrite";
import { syncDeckColorIdentity } from "@/lib/deck";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  preconName: z.string().trim().max(80).optional().nullable(),
  cards: z.array(cardInputSchema).min(1, "A deck needs at least one card"),
});

type Params = { params: { id: string } };

export const PATCH = handle(async (req: Request, { params }: Params) => {
  const me = await requireUser();
  const deck = await prisma.deck.findUnique({ where: { id: params.id } });
  if (!deck) return json({ error: "Deck not found." }, 404);
  if (deck.ownerId !== me.id && !me.isAdmin) {
    return json({ error: "This isn't your deck." }, 403);
  }

  const body = patchSchema.parse(await req.json());
  const baselineIds = new Set(deck.baselineCardIds);

  // Enforce the league rules: reject saves that introduce hard errors.
  const validation = await validateCardInputs(body.cards, baselineIds);
  if (!validation.ok) {
    return json(
      { error: "These changes break the league rules.", validation },
      422,
    );
  }

  await prisma.deck.update({
    where: { id: deck.id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.preconName !== undefined ? { preconName: body.preconName } : {}),
    },
  });
  await writeDeckCards(deck.id, baselineIds, body.cards);
  await syncDeckColorIdentity(deck.id);

  return json({ ok: true, validation });
});

export const DELETE = handle(async (_req: Request, { params }: Params) => {
  const me = await requireUser();
  const deck = await prisma.deck.findUnique({ where: { id: params.id } });
  if (!deck) return json({ error: "Deck not found." }, 404);
  if (deck.ownerId !== me.id && !me.isAdmin) {
    return json({ error: "This isn't your deck." }, 403);
  }

  await prisma.deck.delete({ where: { id: params.id } });
  return json({ ok: true });
});
