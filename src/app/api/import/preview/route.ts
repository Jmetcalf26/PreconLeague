import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { parseDecklist, type ParsedDecklist } from "@/lib/decklist";
import { fetchMoxfieldDeck } from "@/lib/moxfield";
import { resolveCardsByName } from "@/lib/scryfall";
import { toCardDTO, type CardDTO } from "@/lib/dto";
import { handle, json } from "@/lib/api";

export const dynamic = "force-dynamic";

const schema = z
  .object({
    mode: z.enum(["paste", "moxfield"]),
    text: z.string().optional(),
    url: z.string().optional(),
  })
  .refine((d) => (d.mode === "paste" ? !!d.text?.trim() : !!d.url?.trim()), {
    message: "Provide a decklist or a Moxfield link.",
  });

export type ImportPreviewCard = {
  name: string;
  quantity: number;
  isCommander: boolean;
  card: CardDTO | null;
};

export const POST = handle(async (req: Request) => {
  await requireUser();
  const body = schema.parse(await req.json());

  let decklist: ParsedDecklist;
  let deckName: string | null = null;

  if (body.mode === "moxfield") {
    const imported = await fetchMoxfieldDeck(body.url!);
    decklist = imported.decklist;
    deckName = imported.deckName;
  } else {
    decklist = parseDecklist(body.text!);
  }

  if (decklist.cards.length === 0) {
    return json({ error: "No cards found in that list." }, 422);
  }

  const { byName, notFound } = await resolveCardsByName(
    decklist.cards.map((c) => c.name),
  );

  const cards: ImportPreviewCard[] = decklist.cards.map((c) => {
    const cached = byName.get(c.name.toLowerCase());
    return {
      name: cached?.name ?? c.name,
      quantity: c.quantity,
      isCommander: c.isCommander,
      card: cached ? toCardDTO(cached) : null,
    };
  });

  return json({
    deckName,
    cards,
    warnings: decklist.warnings,
    notFound,
  });
});
