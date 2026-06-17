"use client";

import { useMemo, useState } from "react";
import { ColorPips } from "./ColorPips";
import { CardThumb } from "./CardThumb";
import { usd } from "@/lib/format";

export type DeckViewCard = {
  id: string;
  name: string;
  quantity: number;
  isCommander: boolean;
  isBaseline: boolean;
  typeLine: string;
  manaValue: number;
  colorIdentity: string[];
  priceUsd: number | null;
  imageNormal: string | null;
  scryfallUri: string | null;
};

const GROUP_ORDER = [
  "Commander",
  "Planeswalker",
  "Creature",
  "Sorcery",
  "Instant",
  "Artifact",
  "Enchantment",
  "Battle",
  "Land",
  "Other",
];

function groupFor(card: DeckViewCard): string {
  if (card.isCommander) return "Commander";
  const t = card.typeLine;
  for (const g of GROUP_ORDER) {
    if (g === "Commander" || g === "Other") continue;
    if (t.includes(g)) return g;
  }
  return "Other";
}

export function DeckCardsView({ cards }: { cards: DeckViewCard[] }) {
  const [view, setView] = useState<"list" | "gallery">("list");

  const groups = useMemo(() => {
    const map = new Map<string, DeckViewCard[]>();
    for (const c of cards) {
      const g = groupFor(c);
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(c);
    }
    for (const list of map.values()) {
      list.sort(
        (a, b) => a.manaValue - b.manaValue || a.name.localeCompare(b.name),
      );
    }
    return GROUP_ORDER.filter((g) => map.has(g)).map(
      (g) => [g, map.get(g)!] as const,
    );
  }, [cards]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Decklist</h2>
        <div className="flex gap-1 rounded-lg border border-ink-800 p-1 text-xs">
          <button
            onClick={() => setView("list")}
            className={`rounded px-3 py-1 ${view === "list" ? "bg-ink-800 text-white" : "text-ink-400"}`}
          >
            List
          </button>
          <button
            onClick={() => setView("gallery")}
            className={`rounded px-3 py-1 ${view === "gallery" ? "bg-ink-800 text-white" : "text-ink-400"}`}
          >
            Gallery
          </button>
        </div>
      </div>

      {view === "gallery" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {cards.map((c) => (
            <a
              key={c.id}
              href={c.scryfallUri ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="group relative block"
            >
              <CardThumb name={c.name} image={c.imageNormal} className="aspect-[5/7] w-full" />
              <div className="absolute right-1 top-1 flex gap-1">
                {c.quantity > 1 && (
                  <span className="chip bg-ink-950/80 text-ink-100">
                    {c.quantity}×
                  </span>
                )}
                {!c.isBaseline && (
                  <span className="chip bg-brand-500/90 text-white">+</span>
                )}
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([group, list]) => (
            <div key={group}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
                {group} · {list.reduce((s, c) => s + c.quantity, 0)}
              </h3>
              <div className="card-panel divide-y divide-ink-800/60">
                {list.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-ink-800/30"
                  >
                    <span className="w-8 text-ink-400">{c.quantity}×</span>
                    <a
                      href={c.scryfallUri ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 truncate font-medium hover:text-brand-300 hover:underline"
                    >
                      {c.name}
                    </a>
                    {!c.isBaseline && (
                      <span className="chip bg-brand-500/20 text-brand-300">
                        upgrade
                      </span>
                    )}
                    <ColorPips colors={c.colorIdentity} size={14} />
                    <span className="w-16 text-right text-ink-300">
                      {usd(c.priceUsd)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
