"use server";

import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { checkRateLimit } from "@/src/lib/rate-limit";
import { XP_LOGIN, getXpForGiftSent, XP_GIFT_RECEIVED_BONUS } from "@/src/lib/levels";
import { neonLevelFromXp } from "@/src/lib/neon-xp-level";

export type ActivityType = "login" | "gift_sent" | "gift_received";

type ActivityResult =
  | { success: true; xpEarned: number; leveledUp?: boolean; newLevel?: number }
  | { success: false; error: string };

export async function handleUserActivity(
  activityType: ActivityType,
  metadata?: { coins?: number; giftType?: string },
  overrideUserId?: string
): Promise<ActivityResult> {
  const session = await auth();
  const sessionUserId = (session as { userId?: string })?.userId ?? (session?.user as { id?: string })?.id;
  const userId = overrideUserId ?? sessionUserId;
  if (!userId || typeof userId !== "string") {
    return { success: false, error: "Unauthorized" };
  }

  if (!overrideUserId && !sessionUserId) {
    return { success: false, error: "Unauthorized" };
  }

  const { allowed } = checkRateLimit(userId, actionForType(activityType));
  if (!allowed) {
    return { success: false, error: "Rate limit exceeded. Please try again later." };
  }

  let xpEarned = 0;
  switch (activityType) {
    case "login":
      xpEarned = XP_LOGIN;
      break;
    case "gift_sent":
      xpEarned = getXpForGiftSent(metadata?.coins ?? 0);
      break;
    case "gift_received":
      xpEarned = XP_GIFT_RECEIVED_BONUS + Math.floor((metadata?.coins ?? 0) / 5);
      break;
    default:
      return { success: false, error: "Invalid activity type" };
  }

  if (xpEarned <= 0 && activityType !== "login") {
    return { success: true, xpEarned: 0 };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { xp: true, currentLevel: true },
      });
      if (!user) throw new Error("User not found");

      const newXp = user.xp + xpEarned;

      await tx.activityLog.create({
        data: {
          userId,
          activityType,
          xpEarned,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });

      const newLevel = neonLevelFromXp(newXp);
      const leveledUp = newLevel > user.currentLevel;

      await tx.user.update({
        where: { id: userId },
        data: { xp: newXp, currentLevel: newLevel },
      });

      if (leveledUp) {
        await tx.notification.create({
          data: {
            userId,
            type: "system",
            title: `Level ${newLevel} reached!`,
            message: "Your Neon level just climbed — keep the vibe going.",
          },
        });
      }

      return { xpEarned, leveledUp, newLevel };
    });

    return {
      success: true,
      xpEarned: result.xpEarned,
      leveledUp: result.leveledUp,
      newLevel: result.newLevel,
    };
  } catch (e) {
    console.error("[handleUserActivity]", e);
    return { success: false, error: "Failed to process activity" };
  }
}

function actionForType(type: ActivityType): "login" | "gift" | "activity" {
  if (type === "login") return "login";
  if (type === "gift_sent" || type === "gift_received") return "gift";
  return "activity";
}
