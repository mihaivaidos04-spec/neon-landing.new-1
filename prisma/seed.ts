import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { DEFAULT_LEVELS } from "../src/lib/levels";

async function main() {
  for (const l of DEFAULT_LEVELS) {
    await prisma.level.upsert({
      where: { level: l.level },
      create: l,
      update: { xpRequired: l.xpRequired, badgeIcon: l.badgeIcon },
    });
  }
  console.log("Seeded levels");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
