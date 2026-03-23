import { prisma } from "@/src/lib/prisma";

export const AUTOMATIC_BADGE_TYPES = [
  "first_match",
  "100_matches",
  "top_gifter",
  "vip",
  "veteran",
] as const;

export type AutomaticBadgeType = (typeof AUTOMATIC_BADGE_TYPES)[number];

const VETERAN_MS = 30 * 24 * 60 * 60 * 1000;
const TOP_GIFTER_MIN_SENT = 10;

/**
 * Ensures `Badge` rows exist for all conditions the user satisfies (idempotent).
 */
export async function syncAutomaticBadges(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      totalMatches: true,
      isVip: true,
      createdAt: true,
    },
  });
  if (!user) return;

  const giftsSent = await prisma.transaction.count({
    where: { senderId: userId, type: "GIFT" },
  });

  const types: string[] = [];
  if ((user.totalMatches ?? 0) >= 1) types.push("first_match");
  if ((user.totalMatches ?? 0) >= 100) types.push("100_matches");
  if (giftsSent >= TOP_GIFTER_MIN_SENT) types.push("top_gifter");
  if (user.isVip) types.push("vip");
  if (Date.now() - user.createdAt.getTime() >= VETERAN_MS) types.push("veteran");

  for (const type of types) {
    try {
      await prisma.badge.upsert({
        where: { userId_type: { userId, type } },
        create: { userId, type },
        update: {},
      });
    } catch {
      /* ignore race */
    }
  }
}
