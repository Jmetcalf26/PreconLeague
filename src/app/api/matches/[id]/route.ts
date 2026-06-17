import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handle, json } from "@/lib/api";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

export const DELETE = handle(async (_req: Request, { params }: Params) => {
  const me = await requireUser();
  const match = await prisma.match.findUnique({ where: { id: params.id } });
  if (!match) return json({ error: "Match not found." }, 404);
  // The recorder or an admin can delete a match.
  if (match.createdById !== me.id && !me.isAdmin) {
    return json({ error: "Only the recorder or an admin can delete this." }, 403);
  }
  await prisma.match.delete({ where: { id: params.id } });
  return json({ ok: true });
});
