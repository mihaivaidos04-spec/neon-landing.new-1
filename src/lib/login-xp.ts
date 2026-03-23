import { prisma } from "@/src/lib/prisma";
import { checkRateLimit } from "@/src/lib/rate-limit";
import { XP_LOGIN } from "@/src/lib/levels";

/** Login XP only — daily streak + coins live in POST /api/user/daily-login */
export async function addLoginXp(userId: string): Promise<void> {
  const { allowed } = checkRateLimit(userId, "login");
  if (!allowed) return;

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          xp: true,
          currentLevel: true,
        },
      });
      if (!user) return;

      const newXp = user.xp + XP_LOGIN;

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
        },
      });

      if (leveledUp) {
        const levelData = levels.find((l) => l.level === newLevel);
        const msg = levelData
          ? `You earned the ${levelData.badgeIcon} badge!`
          : "Your Neon level just climbed — keep the vibe going.";
        await tx.notification.create({
          data: {
            userId,
            type: "system",
            title: `Level ${newLevel} reached!`,
            message: msg,
          },
        });
      }
    });
  } catch (e) {
    console.error("[addLoginXp]", e);
  }
}
