import { COLOR_META } from "@/lib/format";

export function ColorPips({
  colors,
  size = 18,
}: {
  colors: string[];
  size?: number;
}) {
  const list = colors.length ? colors : ["C"];
  return (
    <span className="inline-flex items-center gap-0.5">
      {list.map((c, i) => {
        const meta = COLOR_META[c] ?? COLOR_META.C;
        return (
          <span
            key={`${c}-${i}`}
            className="inline-flex items-center justify-center rounded-full font-bold leading-none ring-1 ring-black/20"
            style={{
              backgroundColor: meta.bg,
              color: meta.text,
              width: size,
              height: size,
              fontSize: size * 0.6,
            }}
            title={meta.name}
          >
            {c}
          </span>
        );
      })}
    </span>
  );
}
