import type { PrismaClient } from "@prisma/client";
import {
  dailyLimitMinutesForTier,
  needsTranslationDailyReset,
  translationTierFromUser,
  type TranslationTier,
} from "@/src/lib/translation-limits";

export type TranslationStatusPayload = {
  tier: TranslationTier;
  dailyLimitMinutes: number;
  usedMinutesToday: number;
  remainingMinutes: number;
  unlimited: boolean;
  resetAtUtc: string;
};

export async function refreshTranslationDayIfNeeded(
  db: PrismaClient,
  userId: string
): Promise<void> {
  const u = await db.user.findUnique({
    where: { id: userId },
    select: { translationResetAt: true },
  });
  if (!u) return;
  const now = new Date();
  if (needsTranslationDailyReset(u.translationResetAt, now)) {
    await db.user.update({
      where: { id: userId },
      data: {
        translationMinutesToday: 0,
        translationResetAt: now,
      },
    });
  }
}

export async function getTranslationStatusForUser(
  db: PrismaClient,
  userId: string
): Promise<TranslationStatusPayload | null> {
  await refreshTranslationDayIfNeeded(db, userId);
  const u = await db.user.findUnique({
    where: { id: userId },
    select: {
      translationMinutesToday: true,
      translationResetAt: true,
      isVip: true,
      totalSpent: true,
    },
  });
  if (!u) return null;
  const tier = translationTierFromUser({
    isVip: u.isVip === true,
    totalSpent: u.totalSpent ?? 0,
  });
  const dailyLimitMinutes = dailyLimitMinutesForTier(tier);
  const unlimited = tier === "gold";
  const used = u.translationMinutesToday ?? 0;
  const remainingMinutes = unlimited ? 999999 : Math.max(0, dailyLimitMinutes - used);
  return {
    tier,
    dailyLimitMinutes,
    usedMinutesToday: used,
    remainingMinutes,
    unlimited,
    resetAtUtc: utcNextMidnightIso(),
  };
}

function utcNextMidnightIso(): string {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
  return next.toISOString();
}
