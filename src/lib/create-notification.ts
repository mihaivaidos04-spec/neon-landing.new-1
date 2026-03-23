import { prisma } from "@/src/lib/prisma";

/** Canonical types; legacy rows may still use uppercase (e.g. GIFT). */
export type AppNotificationType =
  | "gift"
  | "match"
  | "streak"
  | "referral"
  | "system"
  | "vip";

export type CreateNotificationInput = {
  userId: string;
  type: AppNotificationType | string;
  title: string;
  message: string;
  link?: string | null;
};

/**
 * Persist one in-app notification. Safe to call from API routes, server actions, webhooks.
 */
export async function createNotification(params: CreateNotificationInput): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message || "",
        link: params.link?.trim() || null,
      },
    });
  } catch (err) {
    console.warn("[create-notification]", err);
  }
}

const GIFT_LABEL: Record<string, string> = {
  heart: "Heart",
  fire: "Fire",
  rocket: "Rocket",
  rose: "Rose",
  diamond: "Diamond",
  coffee: "Coffee",
};

export function giftNotificationCopy(senderName: string, giftType: string): { title: string; message: string } {
  const label = GIFT_LABEL[giftType] ?? giftType.charAt(0).toUpperCase() + giftType.slice(1);
  const safeName = senderName.trim() || "Someone";
  return {
    title: "New gift",
    message: `🎁 ${safeName} sent you a ${label}!`,
  };
}

/** Broadcast a system line to every user (chunked). Use sparingly (e.g. feature launches). */
export async function broadcastSystemNotificationToAllUsers(
  title: string,
  message: string,
  link?: string | null
): Promise<number> {
  const CHUNK = 500;
  let total = 0;
  let skip = 0;
  try {
    for (;;) {
      const rows = await prisma.user.findMany({
        select: { id: true },
        skip,
        take: CHUNK,
        orderBy: { id: "asc" },
      });
      if (rows.length === 0) break;
      await prisma.notification.createMany({
        data: rows.map((u) => ({
          userId: u.id,
          type: "system",
          title,
          message: message || "",
          read: false,
          link: link?.trim() || null,
        })),
      });
      total += rows.length;
      skip += CHUNK;
      if (rows.length < CHUNK) break;
    }
    return total;
  } catch (e) {
    console.warn("[broadcastSystemNotificationToAllUsers]", e);
    return total;
  }
}
