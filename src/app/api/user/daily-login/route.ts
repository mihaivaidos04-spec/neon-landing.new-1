import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { addCoins, getWalletBalance } from "@/src/lib/wallet";
import { checkRateLimit } from "@/src/lib/rate-limit";
import {
  processDailyStreakClaim,
  WEEKLY_STREAK_BADGE_TYPE,
} from "@/src/lib/daily-streak-login";
import { utcDayKey } from "@/src/lib/daily-login-streak";
import { createNotification } from "@/src/lib/create-notification";

export const runtime = "nodejs";

function sessionUserId(session: unknown): string | undefined {
  const s = session as { userId?: string; user?: { id?: string } } | null | undefined;
  return s?.userId ?? s?.user?.id;
}

export async function POST() {
  try {
    const session = await auth();
    const userId = sessionUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = checkRateLimit(userId, "daily_login");
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        lastLogin: true,
        lastLoginDate: true,
        currentStreak: true,
        longestStreak: true,
        totalCoinsEarned: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const now = new Date();
    const result = processDailyStreakClaim({
      lastLogin: user.lastLogin,
      lastLoginDate: user.lastLoginDate,
      currentStreak: user.currentStreak ?? 0,
      longestStreak: user.longestStreak ?? 0,
      now,
    });

    if (result.kind === "already_today") {
      const balance = await getWalletBalance(userId);
      return NextResponse.json({
        alreadyToday: true,
        currentStreak: result.currentStreak,
        longestStreak: result.longestStreak,
        coinsEarned: 0,
        weeklyBadge: false,
        calendar: result.calendar,
        balance: balance ?? 0,
        showModal: false,
      });
    }

    const snap = {
      lastLoginDate: user.lastLoginDate,
      lastLogin: user.lastLogin,
      currentStreak: user.currentStreak ?? 0,
      longestStreak: user.longestStreak ?? 0,
      totalCoinsEarned: user.totalCoinsEarned ?? 0,
    };

    const data = {
      lastLoginDate: now,
      lastLogin: now,
      currentStreak: result.newStreak,
      longestStreak: result.longestStreak,
      totalCoinsEarned: { increment: result.coinsEarned },
    };

    const claimed =
      snap.lastLoginDate == null
        ? await prisma.user.updateMany({ where: { id: userId, lastLoginDate: null }, data })
        : await prisma.user.updateMany({
            where: { id: userId, lastLoginDate: snap.lastLoginDate },
            data,
          });

    if (claimed.count === 0) {
      const fresh = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          lastLogin: true,
          lastLoginDate: true,
          currentStreak: true,
          longestStreak: true,
        },
      });
      const balance = await getWalletBalance(userId);
      if (!fresh) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      const again = processDailyStreakClaim({
        lastLogin: fresh.lastLogin,
        lastLoginDate: fresh.lastLoginDate,
        currentStreak: fresh.currentStreak ?? 0,
        longestStreak: fresh.longestStreak ?? 0,
        now,
      });
      if (again.kind === "already_today") {
        return NextResponse.json({
          alreadyToday: true,
          currentStreak: again.currentStreak,
          longestStreak: again.longestStreak,
          coinsEarned: 0,
          weeklyBadge: false,
          calendar: again.calendar,
          balance: balance ?? 0,
          showModal: false,
        });
      }
      return NextResponse.json({
        alreadyToday: true,
        currentStreak: fresh.currentStreak ?? 0,
        longestStreak: fresh.longestStreak ?? 0,
        coinsEarned: 0,
        weeklyBadge: false,
        calendar: result.calendar,
        balance: balance ?? 0,
        showModal: false,
      });
    }

    const todayKey = utcDayKey(now);
    const coinResult = await addCoins(userId, result.coinsEarned, {
      externalId: `daily-streak-${userId}-${todayKey}`,
      reason: "daily_login_streak",
    });

    if (!coinResult.success) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          lastLoginDate: snap.lastLoginDate,
          lastLogin: snap.lastLogin,
          currentStreak: snap.currentStreak,
          longestStreak: snap.longestStreak,
          totalCoinsEarned: snap.totalCoinsEarned,
        },
      });
      return NextResponse.json(
        { error: coinResult.error ?? "Could not credit coins", balance: coinResult.newBalance },
        { status: 502 }
      );
    }

    if (result.weeklyBadge) {
      await prisma.badge
        .upsert({
          where: {
            userId_type: { userId, type: WEEKLY_STREAK_BADGE_TYPE },
          },
          create: { userId, type: WEEKLY_STREAK_BADGE_TYPE },
          update: {},
        })
        .catch(() => {});
    }

    if (result.kind === "granted" && result.newStreak > 0 && result.newStreak % 7 === 0) {
      const extra = result.weeklyBadge ? " · Weekly streak badge unlocked!" : "";
      await createNotification({
        userId,
        type: "streak",
        title: `${result.newStreak} day streak!`,
        message: `🔥 ${result.newStreak} day streak! You earned ${result.coinsEarned} coins${extra}`,
        link: "/profile",
      });
    }

    return NextResponse.json({
      alreadyToday: false,
      currentStreak: result.newStreak,
      longestStreak: result.longestStreak,
      coinsEarned: result.coinsEarned,
      weeklyBadge: result.weeklyBadge,
      calendar: result.calendar,
      balance: coinResult.newBalance,
      showModal: true,
    });
  } catch (err) {
    console.error("[api/user/daily-login]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
