import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Ensure the singleton league config row exists with sensible defaults.
  const league = await prisma.league.upsert({
    where: { id: "league" },
    update: {},
    create: {
      id: "league",
      name: "Precon League",
      description:
        "A casual Commander league. Start from a preconstructed deck and upgrade it within a $15 budget.",
      upgradeBudgetUsd: 15,
    },
  });
  console.log(`✓ League ready: ${league.name} ($${league.upgradeBudgetUsd} budget)`);
  console.log(
    "Register the first account in the app — it becomes admin automatically.",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
