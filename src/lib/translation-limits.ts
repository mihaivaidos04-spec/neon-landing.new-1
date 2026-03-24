import { vipTierFromUser, type VipTier } from "./vip-tier";

/** Daily AI Whisper translation caps (minutes per UTC day). All tiers unlimited — no paywall. */
export const TRANSLATION_LIMITS = {
  free: 999999,
  bronze: 999999,
  silver: 999999,
  gold: 999999,
} as const;

export type TranslationTier = VipTier;

export function translationTierFromUser(u: { isVip: boolean }): TranslationTier {
  return vipTierFromUser(u);
}

export function dailyLimitMinutesForTier(tier: TranslationTier): number {
  return TRANSLATION_LIMITS[tier];
}

/** Start of current UTC calendar day. */
export function utcDayStart(d: Date = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

/** True if `resetAt` is before today's UTC midnight (needs reset). */
export function needsTranslationDailyReset(resetAt: Date, now: Date = new Date()): boolean {
  return resetAt < utcDayStart(now);
}
