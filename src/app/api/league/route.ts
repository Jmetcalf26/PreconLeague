import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getLeague } from "@/lib/league";
import { handle, json } from "@/lib/api";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(500).optional().nullable(),
  upgradeBudgetUsd: z.number().min(0).max(100000).optional(),
  enforceColorIdentity: z.boolean().optional(),
  enforceSingleton: z.boolean().optional(),
  requireCommander: z.boolean().optional(),
  minDeckSize: z.number().int().min(1).max(250).optional(),
  maxDeckSize: z.number().int().min(1).max(250).optional(),
  bannedCards: z.array(z.string().trim().min(1)).max(500).optional(),
  enforceMaxChanges: z.boolean().optional(),
  maxLandChanges: z.number().int().min(0).max(250).optional(),
  maxNonlandChanges: z.number().int().min(0).max(250).optional(),
  placementPoints: z.array(z.number().int().min(0).max(100)).max(8).optional(),
});

export const PATCH = handle(async (req: Request) => {
  await requireAdmin();
  await getLeague(); // ensure the row exists
  const body = schema.parse(await req.json());

  const league = await prisma.league.update({
    where: { id: "league" },
    data: body,
  });
  return json({ ok: true, league });
});
