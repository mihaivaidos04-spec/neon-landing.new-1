/**
 * User ranks based on total coin consumption (lifetime or session).
 * Bronze → Silver → Gold → Platinum → Neon God
 */

export type RankId = "bronze" | "silver" | "gold" | "platinum" | "neon_god";

export const RANK_THRESHOLDS: Record<RankId, number> = {
  bronze: 0,
  silver: 50,
  gold: 150,
  platinum: 400,
  neon_god: 1000,
};

export const RANK_ORDER: RankId[] = ["bronze", "silver", "gold", "platinum", "neon_god"];

export function getRankFromCoinsSpent(coinsSpent: number): RankId {
  let rank: RankId = "bronze";
  for (const r of RANK_ORDER) {
    if (coinsSpent >= RANK_THRESHOLDS[r]) rank = r;
  }
  return rank;
}

export function getNextRank(current: RankId): RankId | null {
  const idx = RANK_ORDER.indexOf(current);
  if (idx < 0 || idx >= RANK_ORDER.length - 1) return null;
  return RANK_ORDER[idx + 1];
}

export function getCoinsToNextRank(coinsSpent: number): { next: RankId; needed: number } | null {
  const current = getRankFromCoinsSpent(coinsSpent);
  const next = getNextRank(current);
  if (!next) return null;
  const threshold = RANK_THRESHOLDS[next];
  const needed = Math.max(0, threshold - coinsSpent);
  return { next, needed };
}

export const RANK_LABELS: Record<RankId, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
  neon_god: "Neon God",
};
