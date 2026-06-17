import Link from "next/link";
import { requirePageUser } from "@/lib/page";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/Avatar";

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  await requirePageUser();
  const players = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      avatarColor: true,
      bio: true,
      isAdmin: true,
      _count: { select: { decks: true, matchPlayers: true } },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Players</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {players.map((p) => (
          <Link
            key={p.id}
            href={`/players/${p.id}`}
            className="card-panel flex items-center gap-4 p-4 transition-transform hover:-translate-y-0.5"
          >
            <Avatar name={p.name} color={p.avatarColor} size={48} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-semibold">{p.name}</h3>
                {p.isAdmin && (
                  <span className="chip bg-brand-500/20 text-brand-300">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-400">
                {p._count.decks} deck{p._count.decks === 1 ? "" : "s"} ·{" "}
                {p._count.matchPlayers} game
                {p._count.matchPlayers === 1 ? "" : "s"}
              </p>
              {p.bio && (
                <p className="mt-1 truncate text-xs text-ink-500">{p.bio}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
