// The obligatory wall of 88×31 buttons, drawn in pure CSS instead of GIFs.
// Hand-crafted homage to the badges that once lined every fansite footer.
const BADGES: { label: string; sub: string; fg: string; bg: string }[] = [
  { label: "Powered by", sub: "SCRYFALL", fg: "#ffffff", bg: "#1a2a6c" },
  { label: "Made with", sub: "NOTEPAD", fg: "#000000", bg: "#dcdcdc" },
  { label: "Best viewed in", sub: "NETSCAPE", fg: "#00ff66", bg: "#000000" },
  { label: "Valid", sub: "HTML 4.01", fg: "#ffffff", bg: "#cc3333" },
  { label: "This site is", sub: "Y2K READY", fg: "#000000", bg: "#ffcc00" },
];

export function WebBadges() {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
      {BADGES.map((b) => (
        <span
          key={b.sub}
          title={`${b.label} ${b.sub}`}
          className="inline-flex h-[31px] w-[88px] flex-col items-center justify-center border-2 border-outset leading-none"
          style={{
            color: b.fg,
            background: b.bg,
            borderColor: "#ffffff #555 #555 #ffffff",
            borderStyle: "outset",
          }}
        >
          <span className="text-[7px] uppercase opacity-80">{b.label}</span>
          <span className="text-[10px] font-bold tracking-tight">{b.sub}</span>
        </span>
      ))}
    </div>
  );
}
