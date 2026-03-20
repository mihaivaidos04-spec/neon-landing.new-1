import { prisma } from "@/src/lib/prisma";
import { checkRateLimit } from "@/src/lib/rate-limit";
import { XP_LOGIN } from "@/src/lib/levels";

export async function addLoginXp(userId: string): Promise<void> {
  const { allowed } = checkRateLimit(userId, "login");
  if (!allowed) return;

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { xp: true, currentLevel: true },
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
        data: { xp: newXp, currentLevel: newLevel, lastLogin: new Date() },
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
  } catch (e) {
    console.error("[addLoginXp]", e);
  }
}
