import type { CardCache } from "@prisma/client";

// Client-safe representation of a cached card.
export type CardDTO = {
  id: string;
  name: string;
  setCode: string;
  collectorNo: string;
  manaValue: number;
  typeLine: string;
  colors: string[];
  colorIdentity: string[];
  canBeCommander: boolean;
  priceUsd: number | null;
  imageSmall: string | null;
  imageNormal: string | null;
  imageArtCrop: string | null;
  scryfallUri: string | null;
};

export function toCardDTO(card: CardCache): CardDTO {
  return {
    id: card.id,
    name: card.name,
    setCode: card.setCode,
    collectorNo: card.collectorNo,
    manaValue: card.manaValue,
    typeLine: card.typeLine,
    colors: card.colors,
    colorIdentity: card.colorIdentity,
    canBeCommander: card.canBeCommander,
    priceUsd: card.priceUsd,
    imageSmall: card.imageSmall,
    imageNormal: card.imageNormal,
    imageArtCrop: card.imageArtCrop,
    scryfallUri: card.scryfallUri,
  };
}
