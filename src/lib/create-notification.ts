import { prisma } from "@/src/lib/prisma";

export type NotificationType = "GIFT" | "FOLLOW" | "LEVEL_UP";

export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  message?: string;
}): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message ?? undefined,
      },
    });
  } catch (err) {
    console.warn("[create-notification]", err);
  }
}
