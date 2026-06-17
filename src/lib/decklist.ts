export type ParsedLine = {
  quantity: number;
  name: string;
  isCommander: boolean;
};

export type ParsedDecklist = {
  cards: ParsedLine[];
  warnings: string[];
};

// Matches "1 Sol Ring", "1x Sol Ring", "Sol Ring" (bare name, no quantity).
// The quantity prefix is entirely optional.
const LINE_RE = /^\s*(?:(\d+)\s*[xX]?\s+)?(.+?)\s*$/;

const SECTION_HEADERS = new Set([
  "commander",
  "commanders",
  "deck",
  "mainboard",
  "main",
  "companion",
  "sideboard",
  "maybeboard",
  "tokens",
]);

/**
 * Parse a pasted decklist in the common "<qty> <name> (<set>) <num>" format
 * used by Moxfield, Archidekt, MTGO and others. Cards under a "Commander"
 * header or tagged with *CMDR* / *Commander* are flagged as commanders.
 */
export function parseDecklist(input: string): ParsedDecklist {
  const warnings: string[] = [];
  const merged = new Map<string, ParsedLine>();
  let currentSection: string | null = null;

  const addCard = (line: ParsedLine) => {
    const key = `${line.name.toLowerCase()}|${line.isCommander}`;
    const existing = merged.get(key);
    if (existing) existing.quantity += line.quantity;
    else merged.set(key, line);
  };

  for (const rawLine of input.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      currentSection = null;
      continue;
    }
    // Comments
    if (line.startsWith("#") || line.startsWith("//")) continue;
    // Sideboard prefix used by some exporters
    if (/^sb:/i.test(line)) continue;

    // Section header (a bare word like "Commander" or "Deck")
    const bare = line.replace(/[:]/g, "").toLowerCase();
    if (SECTION_HEADERS.has(bare)) {
      currentSection = bare;
      continue;
    }

    // Detect commander tags like *CMDR* or *Commander*
    const isTaggedCommander = /\*\s*(cmdr|commander)\s*\*/i.test(line);

    // Strip trailing set/collector/tag annotations for a clean card name.
    let cleaned = line
      .replace(/\*[^*]*\*/g, "") // *CMDR*, *F* (foil), etc.
      .replace(/\((?:[A-Za-z0-9]{2,6})\)\s*[A-Za-z0-9-]*\s*$/g, "") // (SET) 123
      .replace(/\s+#.*$/, "") // inline comments
      .trim();

    const match = cleaned.match(LINE_RE);
    if (!match) {
      warnings.push(`Couldn't parse line: "${rawLine.trim()}"`);
      continue;
    }

    const quantity = match[1] ? parseInt(match[1], 10) : 1;
    const name = match[2].trim();
    if (!name) {
      warnings.push(`Empty card name on line: "${rawLine.trim()}"`);
      continue;
    }

    const isCommander =
      isTaggedCommander ||
      currentSection === "commander" ||
      currentSection === "commanders";

    addCard({ quantity, name, isCommander });
  }

  return { cards: Array.from(merged.values()), warnings };
}
