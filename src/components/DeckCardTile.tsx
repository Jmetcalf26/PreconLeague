import Link from "next/link";
import { Avatar } from "./Avatar";
import { ColorPips } from "./ColorPips";
import { usd } from "@/lib/format";

export type DeckTileData = {
  id: string;
  name: string;
  preconName: string | null;
  colorIdentity: string[];
  cardCount: number;
  totalValueUsd: number;
  upgradeValueUsd: number;
  commanderName: string | null;
  commanderArt: string | null;
  owner: { id: string; name: string; avatarColor: string };
};

export function DeckCardTile({
  deck,
  budget,
}: {
  deck: DeckTileData;
  budget?: number;
}) {
  const pct =
    budget && budget > 0
      ? Math.min(100, Math.round((deck.upgradeValueUsd / budget) * 100))
      : 0;
  const over = budget != null && deck.upgradeValueUsd > budget;

  return (
    <Link
      href={`/decks/${deck.id}`}
      className="card-panel group block overflow-hidden transition-transform hover:-translate-y-0.5"
    >
      <div className="relative h-28 overflow-hidden bg-ink-800">
        {deck.commanderArt ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={deck.commanderArt}
            alt={deck.commanderName ?? deck.name}
            className="h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full place-items-center text-ink-500">
            No commander art
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950 to-transparent p-3">
          <div className="flex items-center gap-2">
            <ColorPips colors={deck.colorIdentity} size={16} />
          </div>
        </div>
      </div>

      <div className="space-y-2 p-4">
        <div>
          <h3 className="truncate font-semibold text-ink-50">{deck.name}</h3>
          {deck.commanderName && (
            <p className="truncate text-xs text-ink-400">{deck.commanderName}</p>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-ink-400">
          <span className="flex items-center gap-1.5">
            <Avatar
              name={deck.owner.name}
              color={deck.owner.avatarColor}
              size={20}
            />
            {deck.owner.name}
          </span>
          <span>{deck.cardCount} cards</span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-ink-400">
            Value{" "}
            <span className="font-medium text-ink-200">
              {usd(deck.totalValueUsd)}
            </span>
          </span>
          <span
            className={over ? "font-semibold text-red-400" : "text-ink-400"}
          >
            Upgrades {usd(deck.upgradeValueUsd)}
          </span>
        </div>

        {budget != null && budget > 0 && (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-800">
            <div
              className={`h-full rounded-full ${over ? "bg-red-500" : "bg-brand-500"}`}
              style={{ width: `${over ? 100 : pct}%` }}
            />
          </div>
        )}
      </div>
    </Link>
  );
}
