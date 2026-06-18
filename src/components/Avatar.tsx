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
      className="inline-flex shrink-0 items-center justify-center border-2 font-bold text-white shadow-[1px_1px_0_0_#000]"
      style={{
        backgroundColor: color,
        width: size,
        height: size,
        fontSize: size * 0.4,
        borderColor: "rgba(255,255,255,0.6) rgba(0,0,0,0.5) rgba(0,0,0,0.5) rgba(255,255,255,0.6)",
        borderStyle: "outset",
        textShadow: "1px 1px 0 rgba(0,0,0,0.5)",
      }}
      title={name}
      aria-hidden
    >
      {initials(name) || "?"}
    </span>
  );
}
