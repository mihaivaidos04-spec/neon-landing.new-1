import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Lazy Prisma for custom `server.js` — init after `loadEnvConfig` so DATABASE_URL is set.
 * Mirrors `src/lib/prisma.ts` (adapter-pg).
 */
let prismaSingleton = null;

export function getPrisma() {
  if (!prismaSingleton) {
    const connectionString = process.env.DATABASE_URL ?? "";
    const adapter = new PrismaPg({ connectionString });
    prismaSingleton = new PrismaClient({ adapter });
  }
  return prismaSingleton;
}
