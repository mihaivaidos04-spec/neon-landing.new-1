/**
 * VIP tier helpers safe for client + server (no DB / Prisma).
 * DB sync lives in `vip-tier-server.ts`.
 */
export type VipTier = "free" | "bronze" | "silver" | "gold";

export function normalizeVipTier(raw: string | null | undefined): VipTier {
  if (raw === "bronze" || raw === "silver" || raw === "gold") return raw;
  return "free";
}

/** Cosmetic tier: whale pack / admin `isVip` → gold; no paid spend tiers. */
export function vipTierFromUser(u: { isVip: boolean }): VipTier {
  if (u.isVip) return "gold";
  return "free";
}

/** Extra weight in `matching.priority_score` (subscription + coins still dominate). */
export function matchmakingPriorityBoost(tier: VipTier): number {
  if (tier === "gold") return 35;
  if (tier === "silver") return 12;
  if (tier === "bronze") return 4;
  return 0;
}
