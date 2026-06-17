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
        <Nav user={user} />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 pb-10 pt-4 text-center text-xs text-ink-500">
          Card data & images via the{" "}
          <a
            href="https://scryfall.com"
            className="underline hover:text-ink-300"
            target="_blank"
            rel="noreferrer"
          >
            Scryfall API
          </a>
          . Not affiliated with Wizards of the Coast.
        </footer>
      </body>
    </html>
  );
}
