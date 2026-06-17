import { prisma } from "@/lib/prisma";
import { handle, json } from "@/lib/api";

export const dynamic = "force-dynamic";

// Lightweight liveness/readiness probe used by docker-compose healthchecks.
export const GET = handle(async () => {
  await prisma.$queryRaw`SELECT 1`;
  return json({ ok: true });
});
