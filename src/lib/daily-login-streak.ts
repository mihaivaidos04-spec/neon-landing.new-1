/**
 * UTC calendar-day login streak for User.currentStreak.
 * - Same UTC day as lastLogin: keep streak (min 1 after first login of day already applied).
 * - Previous UTC day: increment.
 * - Older gap: reset to 1.
 */

export function utcDayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addUtcDays(ymd: string, deltaDays: number): string {
  const [y, m, day] = ymd.split("-").map((x) => parseInt(x, 10));
  const dt = new Date(Date.UTC(y, m - 1, day + deltaDays));
  return dt.toISOString().slice(0, 10);
}

export type StreakUpdate = {
  newStreak: number;
  grantMilestoneBonus: boolean;
};

export function computeNextStreak(
  lastLogin: Date,
  prevStreak: number,
  now: Date = new Date()
): StreakUpdate {
  const todayK = utcDayKey(now);
  const lastK = utcDayKey(lastLogin);
  const yesterdayK = addUtcDays(todayK, -1);

  if (lastK === todayK) {
    return {
      newStreak: Math.max(prevStreak || 0, 1),
      grantMilestoneBonus: false,
    };
  }

  if (lastK === yesterdayK) {
    const next = (prevStreak || 0) + 1;
    const newStreak = next < 1 ? 1 : next;
    const grantMilestoneBonus = newStreak > 0 && newStreak % 5 === 0;
    return { newStreak, grantMilestoneBonus };
  }

  return { newStreak: 1, grantMilestoneBonus: false };
}
