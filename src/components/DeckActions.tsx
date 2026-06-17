"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeckActions({ deckId }: { deckId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirm("Delete this deck permanently? This can't be undone.")) return;
    setBusy(true);
    const res = await fetch(`/api/decks/${deckId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/decks");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Couldn't delete the deck.");
      setBusy(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Link href={`/decks/${deckId}/edit`} className="btn-primary">
        Edit deck
      </Link>
      <button onClick={remove} className="btn-danger" disabled={busy}>
        {busy ? "…" : "Delete"}
      </button>
    </div>
  );
}
