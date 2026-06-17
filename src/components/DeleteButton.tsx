"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteButton({
  url,
  redirectTo,
  confirmText,
  label = "Delete",
}: {
  url: string;
  redirectTo: string;
  confirmText: string;
  label?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function go() {
    if (!confirm(confirmText)) return;
    setBusy(true);
    const res = await fetch(url, { method: "DELETE" });
    if (res.ok) {
      router.push(redirectTo);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Couldn't delete.");
      setBusy(false);
    }
  }

  return (
    <button onClick={go} className="btn-danger" disabled={busy}>
      {busy ? "…" : label}
    </button>
  );
}
