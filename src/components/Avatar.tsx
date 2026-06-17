import { initials } from "@/lib/format";

export function Avatar({
  name,
  color,
  size = 36,
}: {
  name: string;
  color: string;
  size?: number;
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white ring-2 ring-ink-950"
      style={{
        backgroundColor: color,
        width: size,
        height: size,
        fontSize: size * 0.4,
      }}
      title={name}
      aria-hidden
    >
      {initials(name) || "?"}
    </span>
  );
}
