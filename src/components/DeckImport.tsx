"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ColorPips } from "./ColorPips";
import { usd } from "@/lib/format";
import type { ImportPreviewCard } from "@/app/api/import/preview/route";

type Preview = {
  deckName: string | null;
  cards: ImportPreviewCard[];
  warnings: string[];
  notFound: string[];
};

export function DeckImport() {
  const router = useRouter();
  const [mode, setMode] = useState<"paste" | "moxfield">("paste");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [preview, setPreview] = useState<Preview | null>(null);
  const [deckName, setDeckName] = useState("");
  const [commanderIds, setCommanderIds] = useState<Set<string>>(new Set());

  async function runPreview(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/import/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "paste" ? { mode, text } : { mode, url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Import failed.");
        return;
      }
      const p = data as Preview;
      setPreview(p);
      setDeckName(p.deckName ?? "");
      setCommanderIds(
        new Set(
          p.cards
            .filter((c) => c.isCommander && c.card)
            .map((c) => c.card!.id),
        ),
      );
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  function toggleCommander(id: string) {
    setCommanderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function createDeck() {
    if (!preview) return;
    setBusy(true);
    setError(null);
    try {
      const resolved = preview.cards.filter((c) => c.card);
      const cards = resolved.map((c) => ({
        cardId: c.card!.id,
        quantity: c.quantity,
        isCommander: commanderIds.has(c.card!.id),
      }));
      const res = await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: deckName || "Untitled deck",
          sourceType: mode,
          sourceUrl: mode === "moxfield" ? url : undefined,
          cards,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't create the deck.");
        return;
      }
      router.push(`/decks/${data.id}`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const resolvedCount = preview?.cards.filter((c) => c.card).length ?? 0;
  const totalQty =
    preview?.cards
      .filter((c) => c.card)
      .reduce((s, c) => s + c.quantity, 0) ?? 0;
  const totalValue =
    preview?.cards
      .filter((c) => c.card)
      .reduce((s, c) => s + (c.card!.priceUsd ?? 0) * c.quantity, 0) ?? 0;

  if (preview) {
    return (
      <div className="space-y-6">
        <div className="card-panel p-6">
          <label className="label">Deck name</label>
          <input
            className="input mb-4"
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            placeholder="My Precon"
          />
          <div className="flex flex-wrap gap-4 text-sm text-ink-300">
            <span>{totalQty} cards</span>
            <span>Total value {usd(totalValue)}</span>
            <span>{commanderIds.size} commander(s) selected</span>
          </div>
          {preview.notFound.length > 0 && (
            <p className="mt-3 rounded-lg border border-amber-900/50 bg-amber-950/30 px-3 py-2 text-sm text-amber-300">
              {preview.notFound.length} card(s) couldn&apos;t be matched on
              Scryfall and were skipped: {preview.notFound.join(", ")}
            </p>
          )}
          {preview.warnings.length > 0 && (
            <p className="mt-3 rounded-lg border border-amber-900/50 bg-amber-950/30 px-3 py-2 text-xs text-amber-300">
              {preview.warnings.join(" · ")}
            </p>
          )}
          {error && (
            <p className="mt-3 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}
          <div className="mt-4 flex gap-3">
            <button
              onClick={createDeck}
              className="btn-primary"
              disabled={busy || resolvedCount === 0}
            >
              {busy ? "Creating…" : `Create deck (${totalQty} cards)`}
            </button>
            <button
              onClick={() => setPreview(null)}
              className="btn-ghost"
              disabled={busy}
            >
              Back
            </button>
          </div>
          <p className="mt-3 text-xs text-ink-500">
            Tip: click a card to mark it as your commander.
          </p>
        </div>

        <div className="card-panel max-h-[28rem] overflow-y-auto scroll-thin">
          <table className="w-full text-sm">
            <tbody>
              {preview.cards.map((c, i) => {
                const isCmd = c.card && commanderIds.has(c.card.id);
                return (
                  <tr
                    key={`${c.name}-${i}`}
                    onClick={() => c.card && toggleCommander(c.card.id)}
                    className={`cursor-pointer border-b border-ink-800/60 last:border-0 ${
                      !c.card
                        ? "opacity-40"
                        : isCmd
                          ? "bg-brand-500/10"
                          : "hover:bg-ink-800/40"
                    }`}
                  >
                    <td className="w-10 px-3 py-2 text-ink-400">{c.quantity}×</td>
                    <td className="px-3 py-2">
                      <span className="font-medium">{c.name}</span>
                      {isCmd && (
                        <span className="chip ml-2 bg-brand-500/20 text-brand-300">
                          Commander
                        </span>
                      )}
                      {!c.card && (
                        <span className="chip ml-2 bg-red-950/50 text-red-300">
                          not found
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {c.card && <ColorPips colors={c.card.colorIdentity} size={15} />}
                    </td>
                    <td className="px-3 py-2 text-right text-ink-300">
                      {c.card ? usd(c.card.priceUsd) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={runPreview} className="card-panel space-y-4 p-6">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("paste")}
          className={mode === "paste" ? "btn-primary" : "btn-secondary"}
        >
          Paste decklist
        </button>
        <button
          type="button"
          onClick={() => setMode("moxfield")}
          className={mode === "moxfield" ? "btn-primary" : "btn-secondary"}
        >
          Moxfield link
        </button>
      </div>

      {mode === "paste" ? (
        <div>
          <label className="label">Decklist</label>
          <textarea
            className="input min-h-[260px] font-mono text-xs"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`1 Atraxa, Praetors' Voice *CMDR*\n1 Sol Ring\n1 Arcane Signet\n...`}
          />
          <p className="mt-2 text-xs text-ink-500">
            Paste from Moxfield (Export → plain text), Archidekt, or MTGO. One
            card per line. Mark a commander with <code>*CMDR*</code> or a{" "}
            <code>Commander</code> header.
          </p>
        </div>
      ) : (
        <div>
          <label className="label">Moxfield deck URL</label>
          <input
            className="input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.moxfield.com/decks/abc123"
          />
          <p className="mt-2 text-xs text-ink-500">
            Moxfield sometimes blocks imports — if it fails, switch to “Paste
            decklist”.
          </p>
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <button type="submit" className="btn-primary" disabled={busy}>
        {busy ? "Resolving cards…" : "Preview import"}
      </button>
    </form>
  );
}
