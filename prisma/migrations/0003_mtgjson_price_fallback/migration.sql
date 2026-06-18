-- AlterTable: track price provenance and the cached MTGJSON uuid used by the
-- price fallback.
ALTER TABLE "CardCache" ADD COLUMN     "priceSource" TEXT,
ADD COLUMN     "mtgjsonUuid" TEXT;
