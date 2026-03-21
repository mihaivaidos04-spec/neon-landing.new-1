/**
 * Neon level curve (purchases + activity XP share the same pool):
 * - Level = floor(sqrt(xp / 10)) + 1
 * - XP from coin purchases: floor(coins / 10) per billing credit
 */

export function neonLevelFromXp(xp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 10)) + 1;
}

/** XP granted when user receives N coins from a Stripe pack (or similar). */
export function xpFromCoinsCredited(coins: number): number {
  if (!Number.isFinite(coins) || coins <= 0) return 0;
  return Math.floor(coins / 10);
}

/** Minimum XP to be considered at level L (L is 1-based). */
export function xpFloorForLevel(level: number): number {
  if (level <= 1) return 0;
  return 10 * (level - 1) ** 2;
}

/** Minimum XP to reach the next level (exclusive upper bound for current bar segment). */
export function xpCeilForCurrentLevel(level: number): number {
  return 10 * level ** 2;
}

export type SqrtXpProgress = {
  progress01: number;
  xpRemaining: number;
  nextLevel: number;
  nextRewardKey: string | null;
};

const NEXT_REWARD_KEYS: Record<number, string> = {
  2: "profile.rewardLevel2",
  3: "profile.rewardLevel3",
  4: "profile.rewardLevel4",
  5: "profile.rewardLevel5",
  6: "profile.rewardLevel6",
  7: "profile.rewardLevel7",
  8: "profile.rewardLevel8",
  9: "profile.rewardLevel9",
  10: "profile.rewardLevel10",
};

/** Progress bar within the current level segment (sqrt curve). */
export function getSqrtXpProgress(xp: number): SqrtXpProgress {
  const level = neonLevelFromXp(xp);
  const lowXp = xpFloorForLevel(level);
  const nextXp = xpCeilForCurrentLevel(level);
  const span = Math.max(1, nextXp - lowXp);
  const into = Math.max(0, xp - lowXp);
  const progress01 = Math.min(1, into / span);
  const xpRemaining = Math.max(0, nextXp - xp);
  const nextLevel = level + 1;
  const nextRewardKey = NEXT_REWARD_KEYS[Math.min(nextLevel, 10)] ?? "profile.rewardGeneric";
  return { progress01, xpRemaining, nextLevel, nextRewardKey };
}
