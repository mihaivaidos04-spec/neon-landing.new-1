/**
 * Daily Reward – first login of day = 5% battery, 7-day streak = Gold Badge + Loyal badge + 50 coins.
 */

import { getSupabase } from "./supabase";
import { chargeBattery } from "./battery";
import { addCoins } from "./wallet";
import { prisma } from "./prisma";

export const DAILY_BATTERY_REWARD = 5; // 5% = un sfert de segment (segment = ~20%)
export const STREAK_FOR_GOLD_BADGE = 7;
export const LOYAL_BADGE_COINS = 50;
export const GOLD_BADGE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export type DailyRewardResult = {
  claimed: boolean;
  battery?: number;
  streak: number;
  goldBadge?: boolean;
  goldBadgeExpiresAt?: string;
  loyalBadge?: boolean;
};

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Claim daily reward if first login of the day.
 * Updates last_login_date, streak_count, grants 5% battery.
 * If streak hits 7, sets gold_badge_expires_at.
 */
export async function claimDailyReward(
  userId: string
): Promise<DailyRewardResult> {
  const supabase = getSupabase();
  const today = todayDate();
  const yesterday = yesterdayDate();

  const { data: profile, error: fetchErr } = await supabase
    .from("user_profiles")
    .select("last_login_date, streak_count, battery_level, gold_badge_expires_at")
    .eq("user_id", userId)
    .single();

  if (fetchErr || !profile) {
    // No profile yet – upsert with streak 1, then grant battery
    const { error: upsertErr } = await supabase.from("user_profiles").upsert(
      {
        user_id: userId,
        last_login_date: today,
        streak_count: 1,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    if (upsertErr) {
      console.error("[daily-reward claim]", upsertErr);
      return { claimed: false, streak: 1 };
    }
    try {
      await prisma.streak.upsert({
        where: { userId },
        create: { userId, streakCount: 1, lastLoginDate: new Date(today + "T12:00:00Z") },
        update: { streakCount: 1, lastLoginDate: new Date(today + "T12:00:00Z") },
      });
    } catch (e) {
      console.error("[daily-reward streak init]", e);
    }
    const { battery } = await chargeBattery(userId, DAILY_BATTERY_REWARD);
    return { claimed: true, battery, streak: 1 };
  }

  const lastLogin = (profile.last_login_date as string) ?? null;
  const streak = (profile.streak_count as number) ?? 0;

  if (lastLogin === today) {
    // Already claimed today
    const hasGoldBadge =
      profile.gold_badge_expires_at &&
      new Date(profile.gold_badge_expires_at as string) > new Date();
    return {
      claimed: false,
      streak,
      goldBadge: !!hasGoldBadge,
      goldBadgeExpiresAt: profile.gold_badge_expires_at as string | undefined,
    };
  }

  // First login of the day – update streak
  let newStreak = 1;
  if (lastLogin === yesterday) {
    newStreak = streak + 1;
  }

  const goldBadgeExpiresAt =
    newStreak >= STREAK_FOR_GOLD_BADGE
      ? new Date(Date.now() + GOLD_BADGE_DURATION_MS).toISOString()
      : null;

  const { error: updateErr } = await supabase
    .from("user_profiles")
    .update({
      last_login_date: today,
      streak_count: newStreak,
      gold_badge_expires_at: goldBadgeExpiresAt ?? profile.gold_badge_expires_at,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (updateErr) {
    console.error("[daily-reward update]", updateErr);
    return { claimed: false, streak };
  }

  const { battery } = await chargeBattery(userId, DAILY_BATTERY_REWARD);

  // Sync to Prisma Streak + grant 50 coins when FIRST hitting 7-day Loyal badge
  const justHitLoyal = newStreak === STREAK_FOR_GOLD_BADGE;
  if (justHitLoyal) {
    try {
      const todayDt = new Date(today + "T12:00:00Z");
      await prisma.streak.upsert({
        where: { userId },
        create: {
          userId,
          streakCount: newStreak,
          lastLoginDate: todayDt,
          loyalBadgeUnlockedAt: new Date(),
        },
        update: {
          streakCount: newStreak,
          lastLoginDate: todayDt,
          loyalBadgeUnlockedAt: new Date(),
        },
      });
      await addCoins(userId, LOYAL_BADGE_COINS, {
        externalId: `loyal_streak_7_${today}`,
        reason: "loyal_streak_7",
      });
    } catch (e) {
      console.error("[daily-reward loyal]", e);
    }
  } else {
    try {
      const todayDt = new Date(today + "T12:00:00Z");
      await prisma.streak.upsert({
        where: { userId },
        create: { userId, streakCount: newStreak, lastLoginDate: todayDt },
        update: { streakCount: newStreak, lastLoginDate: todayDt },
      });
    } catch (e) {
      console.error("[daily-reward streak sync]", e);
    }
  }

  return {
    claimed: true,
    battery,
    streak: newStreak,
    goldBadge: justHitLoyal,
    goldBadgeExpiresAt: goldBadgeExpiresAt ?? undefined,
    loyalBadge: justHitLoyal,
  };
}

/**
 * Get current daily reward status (for calendar UI).
 */
export async function getDailyRewardStatus(
  userId: string
): Promise<{
  streak: number;
  lastLoginDate: string | null;
  claimedToday: boolean;
  goldBadge: boolean;
  goldBadgeExpiresAt: string | null;
  loyalBadge?: boolean;
}> {
  const supabase = getSupabase();
  const today = todayDate();

  const { data, error } = await supabase
    .from("user_profiles")
    .select("last_login_date, streak_count, gold_badge_expires_at")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return {
      streak: 0,
      lastLoginDate: null,
      claimedToday: false,
      goldBadge: false,
      goldBadgeExpiresAt: null,
    };
  }

  const lastLogin = (data.last_login_date as string) ?? null;
  const streak = (data.streak_count as number) ?? 0;
  const expiresAt = data.gold_badge_expires_at as string | null;
  const goldBadge = !!expiresAt && new Date(expiresAt) > new Date();

  return {
    streak,
    lastLoginDate: lastLogin,
    claimedToday: lastLogin === today,
    goldBadge,
    goldBadgeExpiresAt: expiresAt,
    loyalBadge: goldBadge, // 7-day = Loyal
  };
}
