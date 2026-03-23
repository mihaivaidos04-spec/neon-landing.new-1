import { utcDayKey, addUtcDays, computeNextStreak } from "@/src/lib/daily-login-streak";

/** Coins for streak days 1–7 (repeats every week). */
export const STREAK_DAY_COINS = [10, 15, 20, 25, 35, 45, 100] as const;

export const WEEKLY_STREAK_BADGE_TYPE = "weekly_streak";

export function coinsForStreakDay(streak: number): number {
  if (streak < 1) return STREAK_DAY_COINS[0];
  const idx = (streak - 1) % 7;
  return STREAK_DAY_COINS[idx];
}

export type DailyLoginCalendarCell = {
  dayKey: string;
  weekdayShort: string;
  filled: boolean;
};

export function buildLast7DaysCalendar(today: Date, streak: number): DailyLoginCalendarCell[] {
  const todayK = utcDayKey(today);
  const cells: DailyLoginCalendarCell[] = [];
  for (let i = 6; i >= 0; i--) {
    const k = addUtcDays(todayK, -i);
    const [y, m, d] = k.split("-").map((x) => parseInt(x, 10));
    const dt = new Date(Date.UTC(y, m - 1, d));
    const weekdayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dt.getUTCDay()] ?? "";
    const streakStartK = addUtcDays(todayK, -(Math.min(Math.max(streak, 0), 7) - 1));
    const filled = k >= streakStartK && k <= todayK;
    cells.push({ dayKey: k, weekdayShort, filled });
  }
  return cells;
}

export type DailyLoginProcessInput = {
  lastLogin: Date;
  lastLoginDate: Date | null;
  currentStreak: number;
  longestStreak: number;
  now?: Date;
};

export type DailyLoginProcessResult =
  | {
      kind: "already_today";
      currentStreak: number;
      longestStreak: number;
      calendar: DailyLoginCalendarCell[];
    }
  | {
      kind: "granted";
      newStreak: number;
      longestStreak: number;
      coinsEarned: number;
      weeklyBadge: boolean;
      calendar: DailyLoginCalendarCell[];
    };

/**
 * Pure streak math + calendar for POST /api/user/daily-login (DB writes in route).
 */
export function processDailyStreakClaim(input: DailyLoginProcessInput): DailyLoginProcessResult {
  const now = input.now ?? new Date();
  const todayK = utcDayKey(now);

  if (input.lastLoginDate != null && utcDayKey(input.lastLoginDate) === todayK) {
    return {
      kind: "already_today",
      currentStreak: input.currentStreak,
      longestStreak: Math.max(input.longestStreak, input.currentStreak),
      calendar: buildLast7DaysCalendar(now, input.currentStreak),
    };
  }

  let newStreak: number;
  if (input.lastLoginDate == null) {
    const { newStreak: ns } = computeNextStreak(input.lastLogin, input.currentStreak ?? 0, now);
    newStreak = ns;
  } else {
    const lastK = utcDayKey(input.lastLoginDate);
    const yesterdayK = addUtcDays(todayK, -1);
    if (lastK === yesterdayK) {
      newStreak = (input.currentStreak ?? 0) + 1;
    } else {
      newStreak = 1;
    }
  }

  const coinsEarned = coinsForStreakDay(newStreak);
  const weeklyBadge = newStreak > 0 && newStreak % 7 === 0;
  const longest = Math.max(input.longestStreak ?? 0, newStreak);

  return {
    kind: "granted",
    newStreak,
    longestStreak: longest,
    coinsEarned,
    weeklyBadge,
    calendar: buildLast7DaysCalendar(now, newStreak),
  };
}
