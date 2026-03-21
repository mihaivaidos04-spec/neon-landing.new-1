import { prisma } from "@/src/lib/prisma";
import { checkRateLimit } from "@/src/lib/rate-limit";
import { XP_LOGIN } from "@/src/lib/levels";
import { computeNextStreak } from "@/src/lib/daily-login-streak";
import { addCoins } from "@/src/lib/wallet";

const STREAK_BONUS_COINS = 10;

export async function addLoginXp(userId: string): Promise<void> {
  const { allowed } = checkRateLimit(userId, "login");
  if (!allowed) return;

  let grantMilestoneBonus = false;
  let bonusStreak = 0;

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          xp: true,
          currentLevel: true,
          lastLogin: true,
          currentStreak: true,
        },
      });
      if (!user) return;

      const newXp = user.xp + XP_LOGIN;
      const now = new Date();
      const streakResult = computeNextStreak(user.lastLogin, user.currentStreak ?? 0, now);
      grantMilestoneBonus = streakResult.grantMilestoneBonus;
      bonusStreak = streakResult.newStreak;

      await tx.activityLog.create({
        data: {
          userId,
          activityType: "login",
          xpEarned: XP_LOGIN,
        },
      });

      const levels = await tx.level.findMany({ orderBy: { level: "asc" } });
      let newLevel = user.currentLevel;
      for (const lvl of levels) {
        if (newXp >= lvl.xpRequired) newLevel = lvl.level;
      }

      const leveledUp = newLevel > user.currentLevel;
      await tx.user.update({
        where: { id: userId },
        data: {
          xp: newXp,
          currentLevel: newLevel,
          lastLogin: now,
          currentStreak: streakResult.newStreak,
        },
      });

      if (leveledUp) {
        const levelData = levels.find((l) => l.level === newLevel);
        await tx.notification.create({
          data: {
            userId,
            type: "level_up",
            title: `Level ${newLevel} reached!`,
            body: levelData ? `You earned the ${levelData.badgeIcon} badge!` : undefined,
          },
        });
      }
    });

    if (grantMilestoneBonus && bonusStreak > 0) {
      const ext = `streak-milestone-${userId}-${bonusStreak}`;
      const res = await addCoins(userId, STREAK_BONUS_COINS, {
        externalId: ext,
        reason: "login_streak_milestone",
      });
      if (res.success) {
        await prisma.user.update({
          where: { id: userId },
          data: { streakBonusPopup: STREAK_BONUS_COINS },
        });
      } else {
        console.warn("[addLoginXp] streak bonus addCoins:", res.error);
      }
    }
  } catch (e) {
    console.error("[addLoginXp]", e);
  }
}
