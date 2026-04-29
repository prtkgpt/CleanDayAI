import { seedAwesomeMaids } from "../lib/seed";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("🌱 Seeding CleanDayCRM (Awesome Maids)…");
  const result = await seedAwesomeMaids();
  console.log("✅ Done.", result);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
