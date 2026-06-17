"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PlayerOption = {
  id: string;
  name: string;
  decks: { id: string; name: string }[];
};

type Slot = {
  userId: string;
  deckId: string;
  placement: number;
};

export function MatchForm({ players }: { players: PlayerOption[] }) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);

  const [playedAt, setPlayedAt] = useState(today);
  const [notes, setNotes] = useState("");
  const [slots, setSlots] = useState<Slot[]>(
    Array.from({ length: 4 }, (_, i) => ({
      userId: "",
      deckId: "",
      placement: i + 1,
    })),
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function update(i: number, patch: Partial<Slot>) {
    setSlots((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    );
  }

  function addSlot() {
    if (slots.length >= 8) return;
    setSlots((prev) => [
      ...prev,
      { userId: "", deckId: "", placement: prev.length + 1 },
    ]);
  }

  function removeSlot(i: number) {
    if (slots.length <= 2) return;
    setSlots((prev) =>
      prev
        .filter((_, idx) => idx !== i)
        .map((s, idx) => ({ ...s, placement: Math.min(s.placement, idx + 1) })),
    );
  }

  function decksFor(userId: string) {
    return players.find((p) => p.id === userId)?.decks ?? [];
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (slots.some((s) => !s.userId || !s.deckId)) {
      setError("Pick a player and a deck for every seat.");
      return;
    }
    const ids = new Set(slots.map((s) => s.userId));
    if (ids.size !== slots.length) {
      setError("Each player can only be in the game once.");
      return;
    }
    const placements = slots.map((s) => s.placement).sort((a, b) => a - b);
    if (!placements.every((p, i) => p === i + 1)) {
      setError(`Placements must be 1–${slots.length} with no ties.`);
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playedAt: new Date(playedAt + "T12:00:00").toISOString(),
          notes: notes || undefined,
          players: slots,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't save the match.");
        return;
      }
      router.push(`/matches/${data.id}`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="card-panel grid gap-4 p-5 sm:grid-cols-2">
        <div>
          <label className="label">Date played</label>
          <input
            type="date"
            className="input"
            value={playedAt}
            onChange={(e) => setPlayedAt(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Notes (optional)</label>
          <input
            className="input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Turn 4 win off a wheel…"
          />
        </div>
      </div>

      <div className="space-y-3">
        {slots.map((slot, i) => (
          <div
            key={i}
            className="card-panel grid grid-cols-1 items-end gap-3 p-4 sm:grid-cols-[1fr_1fr_auto_auto]"
          >
            <div>
              <label className="label">Player</label>
              <select
                className="input"
                value={slot.userId}
                onChange={(e) =>
                  update(i, { userId: e.target.value, deckId: "" })
                }
              >
                <option value="">Select…</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Deck</label>
              <select
                className="input"
                value={slot.deckId}
                onChange={(e) => update(i, { deckId: e.target.value })}
                disabled={!slot.userId}
              >
                <option value="">
                  {slot.userId ? "Select…" : "Pick a player first"}
                </option>
                {decksFor(slot.userId).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Place</label>
              <select
                className="input"
                value={slot.placement}
                onChange={(e) =>
                  update(i, { placement: Number(e.target.value) })
                }
              >
                {slots.map((_, idx) => (
                  <option key={idx} value={idx + 1}>
                    {idx + 1}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => removeSlot(i)}
              className="btn-ghost mb-0.5 h-10"
              disabled={slots.length <= 2}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={addSlot}
          className="btn-secondary"
          disabled={slots.length >= 8}
        >
          + Add seat
        </button>
        <span className="text-xs text-ink-500">{slots.length} players</span>
      </div>

      {error && (
        <p className="rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <button type="submit" className="btn-primary" disabled={busy}>
        {busy ? "Saving…" : "Record game"}
      </button>
    </form>
  );
}
