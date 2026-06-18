"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { League } from "@prisma/client";

export function AdminForm({ league }: { league: League }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: league.name,
    description: league.description ?? "",
    upgradeBudgetUsd: league.upgradeBudgetUsd,
    enforceColorIdentity: league.enforceColorIdentity,
    enforceSingleton: league.enforceSingleton,
    requireCommander: league.requireCommander,
    minDeckSize: league.minDeckSize,
    maxDeckSize: league.maxDeckSize,
    enforceMaxChanges: league.enforceMaxChanges,
    maxLandChanges: league.maxLandChanges,
    maxNonlandChanges: league.maxNonlandChanges,
    placementPoints: league.placementPoints.join(", "),
    bannedCards: league.bannedCards.join("\n"),
  });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/league", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          upgradeBudgetUsd: Number(form.upgradeBudgetUsd),
          enforceColorIdentity: form.enforceColorIdentity,
          enforceSingleton: form.enforceSingleton,
          requireCommander: form.requireCommander,
          minDeckSize: Number(form.minDeckSize),
          maxDeckSize: Number(form.maxDeckSize),
          enforceMaxChanges: form.enforceMaxChanges,
          maxLandChanges: Number(form.maxLandChanges),
          maxNonlandChanges: Number(form.maxNonlandChanges),
          placementPoints: form.placementPoints
            .split(",")
            .map((s) => parseInt(s.trim(), 10))
            .filter((n) => Number.isFinite(n)),
          bannedCards: form.bannedCards
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ ok: false, text: data.error ?? "Couldn't save." });
        return;
      }
      setMsg({ ok: true, text: "League settings saved." });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function refreshPrices() {
    setRefreshing(true);
    setMsg(null);
    try {
      const res = await fetch("/api/league/refresh-prices", { method: "POST" });
      const data = await res.json();
      setMsg(
        res.ok
          ? {
              ok: true,
              text: `Refreshed ${data.updated} card prices from Scryfall${
                data.mtgjsonFallback
                  ? ` (${data.mtgjsonFallback} priced via MTGJSON fallback)`
                  : ""
              }.`,
            }
          : { ok: false, text: data.error ?? "Couldn't refresh." },
      );
      router.refresh();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="card-panel space-y-4 p-5">
        <h2 className="font-semibold">League</h2>
        <div>
          <label className="label">Name</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea
            className="input min-h-[70px]"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>
      </div>

      <div className="card-panel space-y-4 p-5">
        <h2 className="font-semibold">Editing restrictions</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Upgrade budget (USD)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input"
              value={form.upgradeBudgetUsd}
              onChange={(e) => set("upgradeBudgetUsd", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">Min deck size</label>
            <input
              type="number"
              className="input"
              value={form.minDeckSize}
              onChange={(e) => set("minDeckSize", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">Max deck size</label>
            <input
              type="number"
              className="input"
              value={form.maxDeckSize}
              onChange={(e) => set("maxDeckSize", Number(e.target.value))}
            />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <Toggle
            label="Enforce color identity"
            checked={form.enforceColorIdentity}
            onChange={(v) => set("enforceColorIdentity", v)}
          />
          <Toggle
            label="Enforce singleton"
            checked={form.enforceSingleton}
            onChange={(v) => set("enforceSingleton", v)}
          />
          <Toggle
            label="Require commander"
            checked={form.requireCommander}
            onChange={(v) => set("requireCommander", v)}
          />
        </div>

        <div className="space-y-3 rounded-lg border border-ink-800 bg-ink-950/40 p-3">
          <Toggle
            label="Limit card changes from the original precon"
            checked={form.enforceMaxChanges}
            onChange={(v) => set("enforceMaxChanges", v)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Max land changes</label>
              <input
                type="number"
                min="0"
                className="input disabled:opacity-50"
                value={form.maxLandChanges}
                disabled={!form.enforceMaxChanges}
                onChange={(e) => set("maxLandChanges", Number(e.target.value))}
              />
            </div>
            <div>
              <label className="label">Max non-land changes</label>
              <input
                type="number"
                min="0"
                className="input disabled:opacity-50"
                value={form.maxNonlandChanges}
                disabled={!form.enforceMaxChanges}
                onChange={(e) => set("maxNonlandChanges", Number(e.target.value))}
              />
            </div>
          </div>
          <p className="text-xs text-ink-500">
            A “change” is any card in a deck that wasn’t in its imported precon
            (an upgrade), counted by copies. Lands and non-lands are capped
            separately.
          </p>
        </div>

        <div>
          <label className="label">Banned cards (one per line)</label>
          <textarea
            className="input min-h-[90px] font-mono text-xs"
            value={form.bannedCards}
            onChange={(e) => set("bannedCards", e.target.value)}
            placeholder={"Sol Ring\nMana Crypt"}
          />
        </div>
      </div>

      <div className="card-panel space-y-4 p-5">
        <h2 className="font-semibold">Scoring</h2>
        <div>
          <label className="label">
            Points by placement (comma-separated: 1st, 2nd, …)
          </label>
          <input
            className="input"
            value={form.placementPoints}
            onChange={(e) => set("placementPoints", e.target.value)}
            placeholder="3, 1, 0, 0"
          />
        </div>
      </div>

      {msg && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            msg.ok
              ? "border border-green-900/50 bg-green-950/40 text-green-300"
              : "border border-red-900/50 bg-red-950/40 text-red-300"
          }`}
        >
          {msg.text}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? "Saving…" : "Save settings"}
        </button>
        <button
          type="button"
          onClick={refreshPrices}
          className="btn-secondary"
          disabled={refreshing}
        >
          {refreshing ? "Refreshing…" : "Refresh card prices from Scryfall"}
        </button>
      </div>
    </form>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-ink-800 bg-ink-950/40 px-3 py-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-brand-500"
      />
      {label}
    </label>
  );
}
