// Client-safe formatting helpers.

export const MANA_COLORS = ["W", "U", "B", "R", "G"] as const;
export type ManaColor = (typeof MANA_COLORS)[number];

export const COLOR_META: Record<
  string,
  { name: string; bg: string; text: string }
> = {
  W: { name: "White", bg: "#f8f6d8", text: "#5b5326" },
  U: { name: "Blue", bg: "#c1d7e9", text: "#1b4f72" },
  B: { name: "Black", bg: "#bab1ab", text: "#211f1d" },
  R: { name: "Red", bg: "#e49977", text: "#7b241c" },
  G: { name: "Green", bg: "#a3c095", text: "#1e4620" },
  C: { name: "Colorless", bg: "#cac5c0", text: "#3b3a39" },
};

export function usd(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
