import type { Prisma } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import { vipTierFromUser } from "@/src/lib/vip-tier";

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
