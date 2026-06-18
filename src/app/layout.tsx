import type { Metadata } from "next";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Precon League",
  description:
    "Track your Magic: The Gathering preconstructed Commander league — decks, upgrades, matches and standings.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body>
        {/* Ye olde scrolling banner */}
        <div className="overflow-hidden border-b-4 border-double border-brand-500 bg-ink-950 py-1.5 text-sm font-bold text-brand-300">
          <div className="inline-block whitespace-nowrap animate-marquee">
            ✦ WELCOME TO THE PRECON LEAGUE ✦&nbsp;&nbsp;&nbsp; 🐉 Where mortals
            battle for glory and a strict upgrade budget 🐉&nbsp;&nbsp;&nbsp; ⚔
            Sign ye guestbook ⚔&nbsp;&nbsp;&nbsp; ★ Best viewed in Netscape
            Navigator at 800×600 ★&nbsp;&nbsp;&nbsp; 🔮 Standings updated DAILY
            🔮&nbsp;&nbsp;&nbsp; ✦ WELCOME TO THE PRECON LEAGUE ✦
          </div>
        </div>

        <Nav user={user} />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>

        <footer className="mx-auto mt-8 max-w-6xl px-4 pb-12 pt-4 text-center text-xs text-ink-300">
          {/* UNDER CONSTRUCTION */}
          <div className="mx-auto mb-4 flex max-w-md items-center gap-2">
            <span className="construction h-3 flex-1 animate-barberpole" />
            <span className="font-display text-base text-brand-300 [text-shadow:1px_1px_0_#000]">
              ⚠ PAGE UNDER CONSTRUCTION ⚠
            </span>
            <span className="construction h-3 flex-1 animate-barberpole" />
          </div>

          {/* Visitor counter + webring */}
          <div className="mb-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <span className="inline-flex items-center gap-2">
              <span className="font-bold uppercase tracking-wide text-brand-400">
                You are visitor #
              </span>
              <span className="border-2 border-ink-700 bg-black px-2 py-0.5 font-mono text-base font-bold text-[#33ff66] [letter-spacing:0.15em]">
                0013337
              </span>
            </span>
            <span className="inline-flex items-center gap-1 font-bold text-brand-400">
              <span className="cursor-pointer hover:text-white">« PREV</span>
              <span className="text-ink-600">|</span>
              <span className="cursor-pointer hover:text-white">RANDOM</span>
              <span className="text-ink-600">|</span>
              <span className="cursor-pointer hover:text-white">NEXT »</span>
            </span>
            <span className="animate-blink font-bold text-[#ff4dff]">
              ✦ NEW! ✦
            </span>
          </div>

          <hr className="mx-auto mb-4 max-w-lg" />

          <p className="text-ink-400">
            Card data &amp; images conjured via the{" "}
            <a
              href="https://scryfall.com"
              className="text-brand-400 underline hover:text-white"
              target="_blank"
              rel="noreferrer"
            >
              Scryfall API
            </a>
            . Not affiliated with Wizards of the Coast. Made with{" "}
            <span className="text-[#ff4d6d]">♥</span> and a 28.8k modem.
          </p>
        </footer>
      </body>
    </html>
  );
}
