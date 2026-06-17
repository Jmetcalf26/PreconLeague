"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ColorPips } from "./ColorPips";
import { ValidationSummary } from "./ValidationSummary";
import { usd } from "@/lib/format";
import { validateDeck, type RuleConfig, type DeckCardState } from "@/lib/validation";
import type { CardDTO } from "@/lib/dto";

export type EditorCard = {
  cardId: string;
  name: string;
  quantity: number;
  isCommander: boolean;
  typeLine: string;
  manaValue: number;
  colorIdentity: string[];
  priceUsd: number | null;
  imageNormal: string | null;
};

type Props = {
  deckId: string;
  deckName: string;
  initialCards: EditorCard[];
  baselineCardIds: string[];
  rules: RuleConfig;
};

export function DeckEditor({
  deckId,
  deckName: initialName,
  initialCards,
  baselineCardIds,
  rules,
}: Props) {
  const router = useRouter();
  const baseline = useMemo(() => new Set(baselineCardIds), [baselineCardIds]);

  const [name, setName] = useState(initialName);
  const [cards, setCards] = useState<EditorCard[]>(initialCards);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // --- search ---------------------------------------------------------------
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CardDTO[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/cards/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(res.ok ? data.cards : []);
        setShowResults(true);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function mutate(next: EditorCard[]) {
    setCards(next);
    setDirty(true);
  }

  function addCard(c: CardDTO) {
    const existing = cards.find((x) => x.cardId === c.id);
    if (existing) {
      mutate(
        cards.map((x) =>
          x.cardId === c.id ? { ...x, quantity: x.quantity + 1 } : x,
        ),
      );
    } else {
      mutate([
        ...cards,
        {
          cardId: c.id,
          name: c.name,
          quantity: 1,
          isCommander: false,
          typeLine: c.typeLine,
          manaValue: c.manaValue,
          colorIdentity: c.colorIdentity,
          priceUsd: c.priceUsd,
          imageNormal: c.imageNormal,
        },
      ]);
    }
    setQuery("");
    setResults([]);
    setShowResults(false);
  }

  function setQty(cardId: string, qty: number) {
    if (qty <= 0) {
      mutate(cards.filter((c) => c.cardId !== cardId));
    } else {
      mutate(cards.map((c) => (c.cardId === cardId ? { ...c, quantity: qty } : c)));
    }
  }

  function toggleCommander(cardId: string) {
    mutate(
      cards.map((c) =>
        c.cardId === cardId ? { ...c, isCommander: !c.isCommander } : c,
      ),
    );
  }

  // --- live validation ------------------------------------------------------
  const validation = useMemo(() => {
    const states: DeckCardState[] = cards.map((c) => ({
      name: c.name,
      quantity: c.quantity,
      isCommander: c.isCommander,
      isBaseline: baseline.has(c.cardId),
      typeLine: c.typeLine,
      colorIdentity: c.colorIdentity,
      priceUsd: c.priceUsd,
    }));
    return validateDeck(states, rules);
  }, [cards, baseline, rules]);

  async function save() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/decks/${deckId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          cards: cards.map((c) => ({
            cardId: c.cardId,
            quantity: c.quantity,
            isCommander: c.isCommander,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error ?? "Couldn't save.");
        return;
      }
      setDirty(false);
      router.push(`/decks/${deckId}`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const sorted = useMemo(
    () =>
      [...cards].sort(
        (a, b) =>
          Number(b.isCommander) - Number(a.isCommander) ||
          a.manaValue - b.manaValue ||
          a.name.localeCompare(b.name),
      ),
    [cards],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="card-panel space-y-3 p-4">
          <div>
            <label className="label">Deck name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setDirty(true);
              }}
            />
          </div>

          <div className="relative">
            <label className="label">Add a card</label>
            <input
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => results.length && setShowResults(true)}
              placeholder="Search Scryfall — e.g. Cultivate"
            />
            {searching && (
              <span className="absolute right-3 top-9 text-xs text-ink-500">…</span>
            )}
            {showResults && results.length > 0 && (
              <div className="card-panel absolute z-30 mt-1 max-h-72 w-full overflow-y-auto scroll-thin p-1">
                {results.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => addCard(c)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-ink-800"
                  >
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="truncate text-xs text-ink-500">
                      {c.typeLine}
                    </span>
                    <ColorPips colors={c.colorIdentity} size={13} />
                    <span className="w-14 text-right text-ink-300">
                      {usd(c.priceUsd)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card-panel max-h-[34rem] overflow-y-auto scroll-thin">
          <table className="w-full text-sm">
            <tbody>
              {sorted.map((c) => {
                const isUpgrade = !baseline.has(c.cardId);
                return (
                  <tr
                    key={c.cardId}
                    className={`border-b border-ink-800/60 last:border-0 ${
                      c.isCommander ? "bg-brand-500/10" : ""
                    }`}
                  >
                    <td className="py-2 pl-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setQty(c.cardId, c.quantity - 1)}
                          className="h-6 w-6 rounded bg-ink-800 text-ink-200 hover:bg-ink-700"
                        >
                          −
                        </button>
                        <span className="w-6 text-center">{c.quantity}</span>
                        <button
                          onClick={() => setQty(c.cardId, c.quantity + 1)}
                          className="h-6 w-6 rounded bg-ink-800 text-ink-200 hover:bg-ink-700"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <span className="font-medium">{c.name}</span>
                      {isUpgrade && (
                        <span className="chip ml-2 bg-brand-500/20 text-brand-300">
                          upgrade
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <ColorPips colors={c.colorIdentity} size={13} />
                    </td>
                    <td className="px-2 py-2 text-right text-ink-300">
                      {usd(c.priceUsd)}
                    </td>
                    <td className="px-2 py-2">
                      <button
                        onClick={() => toggleCommander(c.cardId)}
                        className={`chip ${
                          c.isCommander
                            ? "bg-brand-500/30 text-brand-200"
                            : "bg-ink-800 text-ink-400 hover:text-ink-200"
                        }`}
                        title="Toggle commander"
                      >
                        ⌁
                      </button>
                    </td>
                    <td className="pr-3">
                      <button
                        onClick={() => setQty(c.cardId, 0)}
                        className="text-ink-500 hover:text-red-400"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
              {cards.length === 0 && (
                <tr>
                  <td className="px-3 py-8 text-center text-ink-500" colSpan={6}>
                    No cards. Search above to add some.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
        <div className="sticky top-24 space-y-4">
          <ValidationSummary validation={validation} />

          {saveError && (
            <p className="rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">
              {saveError}
            </p>
          )}

          <div className="card-panel space-y-2 p-4">
            <button
              onClick={save}
              className="btn-primary w-full"
              disabled={saving || !validation.ok || !dirty}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            {!validation.ok && (
              <p className="text-center text-xs text-red-300">
                Fix the issues above to save.
              </p>
            )}
            {validation.ok && !dirty && (
              <p className="text-center text-xs text-ink-500">
                No unsaved changes.
              </p>
            )}
            <button
              onClick={() => router.push(`/decks/${deckId}`)}
              className="btn-ghost w-full"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
