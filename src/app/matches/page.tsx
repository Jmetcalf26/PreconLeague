import Link from "next/link";
import { requirePageUser } from "@/lib/page";
import { prisma } from "@/lib/prisma";
import { MatchRow } from "@/components/MatchRow";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  await requirePageUser();

  const matches = await prisma.match.findMany({
    orderBy: { playedAt: "desc" },
    include: {
      players: {
        orderBy: { placement: "asc" },
        include: { user: { select: { id: true, name: true, avatarColor: true } } },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Match history</h1>
          <p className="mt-1 text-sm text-ink-400">
            {matches.length} game{matches.length === 1 ? "" : "s"} recorded.
          </p>
        </div>
        <Link href="/matches/new" className="btn-primary">
          + Record game
        </Link>
      </div>

      {matches.length === 0 ? (
        <div className="card-panel p-10 text-center text-ink-300">
          No games yet.{" "}
          <Link href="/matches/new" className="text-brand-400 hover:underline">
            Record your first
          </Link>
          .
        </div>
      ) : (
        <div className="card-panel divide-y divide-ink-800">
          {matches.map((m) => (
            <MatchRow key={m.id} match={m} />
          ))}
        </div>
      )}
    </div>
  );
}
