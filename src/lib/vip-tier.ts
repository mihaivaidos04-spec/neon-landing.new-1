import type { Prisma } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";

export type VipTier = "free" | "bronze" | "silver" | "gold";

export function normalizeVipTier(raw: string | null | undefined): VipTier {
  if (raw === "bronze" || raw === "silver" || raw === "gold") return raw;
  return "free";
}

/** Same thresholds as AI translation caps — aligns spend + Whale pack with visible tier. */
export function vipTierFromUser(u: { isVip: boolean; totalSpent: number }): VipTier {
  if (u.isVip) return "gold";
  if (u.totalSpent >= 5) return "silver";
  if (u.totalSpent >= 2.99) return "bronze";
  return "free";
}

/** Extra weight in `matching.priority_score` (subscription + coins still dominate). */
export function matchmakingPriorityBoost(tier: VipTier): number {
  if (tier === "gold") return 35;
  if (tier === "silver") return 12;
  if (tier === "bronze") return 4;
  return 0;
}

export async function syncUserVipTierInTx(tx: Prisma.TransactionClient, userId: string): Promise<void> {
  const u = await tx.user.findUnique({
    where: { id: userId },
    select: { isVip: true, totalSpent: true },
  });
  if (!u) return;
  const tier = vipTierFromUser({ isVip: u.isVip === true, totalSpent: u.totalSpent ?? 0 });
  await tx.user.update({ where: { id: userId }, data: { vipTier: tier } });
}

export async function syncUserVipTierById(userId: string): Promise<void> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { isVip: true, totalSpent: true },
  });
  if (!u) return;
  const tier = vipTierFromUser({ isVip: u.isVip === true, totalSpent: u.totalSpent ?? 0 });
  await prisma.user.update({ where: { id: userId }, data: { vipTier: tier } });
}
