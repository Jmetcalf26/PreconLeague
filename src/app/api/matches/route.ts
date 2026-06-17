import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handle, json } from "@/lib/api";

export const dynamic = "force-dynamic";

const schema = z.object({
  playedAt: z.string().datetime().optional(),
  notes: z.string().trim().max(500).optional().nullable(),
  players: z
    .array(
      z.object({
        userId: z.string().min(1),
        deckId: z.string().min(1),
        placement: z.number().int().min(1).max(8),
        turnOrder: z.number().int().min(1).max(8).optional().nullable(),
      }),
    )
    .min(2, "A game needs at least 2 players")
    .max(8),
});

export const POST = handle(async (req: Request) => {
  const me = await requireUser();
  const body = schema.parse(await req.json());

  // Each player and each placement must be unique within a match.
  const userIds = new Set(body.players.map((p) => p.userId));
  if (userIds.size !== body.players.length) {
    return json({ error: "A player can only appear once per game." }, 422);
  }
  const placements = body.players.map((p) => p.placement).sort((a, b) => a - b);
  const expected = placements.every((p, i) => p === i + 1);
  if (!expected) {
    return json(
      { error: `Placements must be 1 through ${body.players.length} with no ties.` },
      422,
    );
  }

  // Confirm the referenced decks exist and belong to the listed players.
  const decks = await prisma.deck.findMany({
    where: { id: { in: body.players.map((p) => p.deckId) } },
    select: { id: true, name: true, ownerId: true },
  });
  const deckById = new Map(decks.map((d) => [d.id, d]));
  for (const p of body.players) {
    const deck = deckById.get(p.deckId);
    if (!deck) return json({ error: "One of the decks no longer exists." }, 422);
    if (deck.ownerId !== p.userId) {
      return json({ error: `${deck.name} doesn't belong to that player.` }, 422);
    }
  }

  const match = await prisma.match.create({
    data: {
      playedAt: body.playedAt ? new Date(body.playedAt) : new Date(),
      notes: body.notes ?? null,
      createdById: me.id,
      players: {
        create: body.players.map((p) => ({
          userId: p.userId,
          deckId: p.deckId,
          deckName: deckById.get(p.deckId)!.name,
          placement: p.placement,
          turnOrder: p.turnOrder ?? null,
        })),
      },
    },
  });

  return json({ id: match.id });
});
