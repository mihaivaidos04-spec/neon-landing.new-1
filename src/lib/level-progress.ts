import { DEFAULT_LEVELS } from "@/src/lib/levels";

export type LevelRow = { level: number; xpRequired: number };

/** Cosmetic unlock teaser for the *next* level (shown under XP bar) */
const NEXT_LEVEL_REWARD_KEYS: Record<number, string> = {
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

export function resolveLevelTable(rows: LevelRow[]): LevelRow[] {
  if (rows.length > 0) {
    return [...rows].sort((a, b) => a.level - b.level);
  }
  return DEFAULT_LEVELS.map((l) => ({ level: l.level, xpRequired: l.xpRequired }));
}

export function getLevelProgress(xp: number, currentLevel: number, levels: LevelRow[]) {
  const sorted = resolveLevelTable(levels);
  const nextLevel = sorted.find((l) => l.level === currentLevel + 1);
  const currentRow = sorted.find((l) => l.level === currentLevel) ?? sorted[0];
  const prevXp = currentRow?.xpRequired ?? 0;

  if (!nextLevel) {
    return {
      progress01: 1,
      xpIntoLevel: xp - prevXp,
      xpSpan: 1,
      xpRemaining: 0,
      nextLevel: null as number | null,
      nextRewardKey: null as string | null,
    };
  }

  const span = Math.max(1, nextLevel.xpRequired - prevXp);
  const into = Math.max(0, xp - prevXp);
  const progress01 = Math.min(1, into / span);
  const xpRemaining = Math.max(0, nextLevel.xpRequired - xp);

  return {
    progress01,
    xpIntoLevel: into,
    xpSpan: span,
    xpRemaining,
    nextLevel: nextLevel.level,
    nextRewardKey: NEXT_LEVEL_REWARD_KEYS[nextLevel.level] ?? "profile.rewardGeneric",
  };
}

/** CSS gradient stops for avatar ring: level 1 pink → level 10 gold */
export function avatarGlowColors(level: number): { from: string; to: string; shadow: string } {
  const t = Math.min(10, Math.max(1, level)) / 10;
  const pinks = { h: 320, s: 90, l: 65 };
  const golds = { h: 43, s: 96, l: 58 };
  const h = pinks.h + (golds.h - pinks.h) * t;
  const s = pinks.s + (golds.s - pinks.s) * t;
  const l = pinks.l + (golds.l - pinks.l) * t;
  const from = `hsl(${h}, ${s}%, ${l}%)`;
  const to = `hsl(${h + 12}, ${Math.min(100, s + 5)}%, ${Math.min(72, l + 8)}%)`;
  const shadow = `0 0 20px hsla(${h}, ${s}%, 55%, 0.65), 0 0 48px hsla(${h}, ${s}%, 50%, 0.35)`;
  return { from, to, shadow };
}
