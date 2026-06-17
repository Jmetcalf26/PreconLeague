import { requireUser } from "@/lib/auth";
import { searchCards } from "@/lib/scryfall";
import { toCardDTO } from "@/lib/dto";
import { handle, json } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: Request) => {
  await requireUser();
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return json({ cards: [] });
  const cards = await searchCards(q);
  return json({ cards: cards.map(toCardDTO) });
});
