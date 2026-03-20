import { prisma } from "@/src/lib/prisma";

const PLATFORM_FEE_PERCENT = 20;
const COINS_TO_EUR = 0.01; // 100 coins = 1€

export interface CreatorAnalytics {
  grossRevenue: number;
  netRevenue: number;
  averageGiftValue: number;
  retentionRate: number;
  peakActivityHours: { hour: number; count: number }[];
  giftDistribution: Record<string, number>;
  revenueOverTime: { date: string; gross: number; net: number }[];
  topCountries: { country: string; coins: number }[];
}

export async function getUserAnalytics(userId: string): Promise<CreatorAnalytics> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const gifts = await prisma.transaction.findMany({
    where: { receiverId: userId, type: "GIFT", createdAt: { gte: thirtyDaysAgo } },
    include: { sender: { select: { country: true } } },
    orderBy: { createdAt: "asc" },
  });

  const totalCoins = gifts.reduce((s, g) => s + g.amount, 0);
  const grossRevenue = totalCoins * COINS_TO_EUR;
  const netRevenue = grossRevenue * (1 - PLATFORM_FEE_PERCENT / 100);

  const giftCount = gifts.length;
  const averageGiftValue = giftCount > 0 ? totalCoins / giftCount : 0;

  const giftDistribution: Record<string, number> = {};
  for (const g of gifts) {
    const key = g.giftType ?? "other";
    giftDistribution[key] = (giftDistribution[key] ?? 0) + g.amount;
  }

  const byHour: Record<number, number> = {};
  for (let h = 0; h < 24; h++) byHour[h] = 0;
  for (const g of gifts) {
    const h = g.createdAt.getHours();
    byHour[h] = (byHour[h] ?? 0) + g.amount;
  }
  const peakActivityHours = Object.entries(byHour)
    .map(([hour, count]) => ({ hour: parseInt(hour, 10), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 24);

  const byDate: Record<string, number> = {};
  for (const g of gifts) {
    const d = g.createdAt.toISOString().slice(0, 10);
    byDate[d] = (byDate[d] ?? 0) + g.amount;
  }
  const revenueOverTime = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, coins]) => ({
      date,
      gross: coins * COINS_TO_EUR,
      net: coins * COINS_TO_EUR * (1 - PLATFORM_FEE_PERCENT / 100),
    }));

  const countryCoins: Record<string, number> = {};
  for (const g of gifts) {
    const c = g.sender?.country ?? "Unknown";
    countryCoins[c] = (countryCoins[c] ?? 0) + g.amount;
  }
  const topCountries = Object.entries(countryCoins)
    .map(([country, coins]) => ({ country, coins }))
    .sort((a, b) => b.coins - a.coins)
    .slice(0, 5);

  const senderDates = new Map<string, Set<string>>();
  for (const g of gifts) {
    const d = g.createdAt.toISOString().slice(0, 10);
    if (!senderDates.has(g.senderId)) senderDates.set(g.senderId, new Set());
    senderDates.get(g.senderId)!.add(d);
  }
  const dates = Object.keys(byDate).sort();
  let retainedCount = 0;
  for (const [, days] of senderDates) {
    const sorted = [...days].sort();
    let streak = 0;
    for (let i = 0; i < sorted.length; i++) {
      const prev = i > 0 ? new Date(sorted[i - 1]).getTime() : 0;
      const curr = new Date(sorted[i]).getTime();
      if (curr - prev <= 86400000 * 2) streak++;
      else streak = 1;
      if (streak >= 3) {
        retainedCount++;
        break;
      }
    }
  }
  const retentionRate = senderDates.size > 0 ? (retainedCount / senderDates.size) * 100 : 0;

  return {
    grossRevenue,
    netRevenue,
    averageGiftValue,
    retentionRate,
    peakActivityHours,
    giftDistribution,
    revenueOverTime,
    topCountries,
  };
}
