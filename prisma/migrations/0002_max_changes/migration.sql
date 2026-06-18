-- AlterTable: per-update card-change caps (lands vs non-lands)
ALTER TABLE "League" ADD COLUMN     "enforceMaxChanges" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxLandChanges" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "maxNonlandChanges" INTEGER NOT NULL DEFAULT 15;
