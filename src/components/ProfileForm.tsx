"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "./Avatar";
import type { SessionUser } from "@/lib/auth";

const COLORS = [
  "#ed591f",
  "#e11d48",
  "#d946ef",
  "#8b5cf6",
  "#3b82f6",
  "#06b6d4",
  "#10b981",
  "#84cc16",
  "#f59e0b",
  "#64748b",
];

export function ProfileForm({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio ?? "");
  const [color, setColor] = useState(user.avatarColor);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const payload: Record<string, unknown> = { name, bio, avatarColor: color };
    if (newPassword) {
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ ok: false, text: data.error ?? "Couldn't save." });
        return;
      }
      setMsg({ ok: true, text: "Profile saved." });
      setCurrentPassword("");
      setNewPassword("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="card-panel space-y-4 p-6">
        <div className="flex items-center gap-4">
          <Avatar name={name || "?"} color={color} size={56} />
          <div>
            <h2 className="font-semibold">Avatar color</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full ring-2 ${
                    color === c ? "ring-white" : "ring-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Use ${c}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="name">
            Display name
          </label>
          <input
            id="name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="bio">
            Bio
          </label>
          <textarea
            id="bio"
            className="input min-h-[80px]"
            value={bio}
            maxLength={280}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Your playstyle, favorite archetype…"
          />
        </div>
      </div>

      <div className="card-panel space-y-4 p-6">
        <h2 className="font-semibold">Change password</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="cur">
              Current password
            </label>
            <input
              id="cur"
              type="password"
              className="input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="label" htmlFor="new">
              New password
            </label>
            <input
              id="new"
              type="password"
              className="input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
          </div>
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

      <button type="submit" className="btn-primary" disabled={busy}>
        {busy ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
