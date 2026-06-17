"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "./Avatar";
import type { SessionUser } from "@/lib/auth";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/standings", label: "Standings" },
  { href: "/decks", label: "Decks" },
  { href: "/matches", label: "Matches" },
  { href: "/players", label: "Players" },
  { href: "/rules", label: "Rules" },
];

export function Nav({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-ink-800 bg-ink-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500 text-white">
            ⚔
          </span>
          <span className="hidden sm:inline">Precon League</span>
        </Link>

        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive(l.href)
                  ? "bg-ink-800 text-white"
                  : "text-ink-300 hover:bg-ink-800/60 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/decks/new"
                className="btn-primary hidden h-9 sm:inline-flex"
              >
                + Import deck
              </Link>
              <div className="group relative">
                <button
                  className="flex items-center gap-2 rounded-lg p-1 hover:bg-ink-800"
                  onClick={() => setOpen((v) => !v)}
                >
                  <Avatar name={user.name} color={user.avatarColor} size={32} />
                </button>
                {open && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setOpen(false)}
                    />
                    <div className="card-panel absolute right-0 z-20 mt-2 w-48 overflow-hidden p-1 text-sm">
                      <div className="px-3 py-2 text-ink-400">
                        Signed in as
                        <div className="font-semibold text-ink-100">
                          {user.name}
                        </div>
                      </div>
                      <Link
                        href="/profile"
                        className="block rounded-lg px-3 py-2 hover:bg-ink-800"
                        onClick={() => setOpen(false)}
                      >
                        Profile & settings
                      </Link>
                      <Link
                        href={`/players/${user.id}`}
                        className="block rounded-lg px-3 py-2 hover:bg-ink-800"
                        onClick={() => setOpen(false)}
                      >
                        My decks
                      </Link>
                      {user.isAdmin && (
                        <Link
                          href="/admin"
                          className="block rounded-lg px-3 py-2 hover:bg-ink-800"
                          onClick={() => setOpen(false)}
                        >
                          League admin
                        </Link>
                      )}
                      <button
                        onClick={logout}
                        className="block w-full rounded-lg px-3 py-2 text-left text-red-300 hover:bg-ink-800"
                      >
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <Link href="/login" className="btn-primary h-9">
              Sign in
            </Link>
          )}
        </div>
      </div>

      {/* mobile nav */}
      <nav className="flex gap-1 overflow-x-auto border-t border-ink-800 px-2 py-2 md:hidden">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ${
              isActive(l.href)
                ? "bg-ink-800 text-white"
                : "text-ink-300 hover:text-white"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
