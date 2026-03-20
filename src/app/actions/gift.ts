"use server";

import { auth } from "@/src/auth";
import { getWalletBalance, spendCoins, addCoins } from "@/src/lib/wallet";
import { prisma } from "@/src/lib/prisma";
import { checkRateLimit } from "@/src/lib/rate-limit";
import { handleUserActivity } from "@/src/app/actions/activity";
import { createNotification } from "@/src/lib/create-notification";

export const GIFT_AMOUNTS = { heart: 5, fire: 50, rocket: 500 } as const;
export type GiftType = keyof typeof GIFT_AMOUNTS;

export type SendGiftResult =
  | { success: true; newBalance: number; senderName: string }
  | { success: false; error: string };

export async function sendGift(receiverId: string, giftType: GiftType): Promise<SendGiftResult> {
  const session = await auth();
  const senderId = (session as { userId?: string })?.userId ?? (session?.user as { id?: string })?.id;
  if (!senderId || typeof senderId !== "string") {
    return { success: false, error: "Unauthorized" };
  }

  if (receiverId === senderId) return { success: false, error: "Cannot send gift to yourself" };

  const { allowed } = checkRateLimit(senderId, "gift");
  if (!allowed) {
    return { success: false, error: "Too many gifts. Please wait before sending more." };
  }

  const amount = GIFT_AMOUNTS[giftType];
  const balance = await getWalletBalance(senderId);
  if (balance == null || balance < amount) {
    return { success: false, error: `Insufficient balance. Need ${amount} coins.` };
  }

  const spendResult = await spendCoins(senderId, amount, "gift");
  if (!spendResult.success) {
    return { success: false, error: spendResult.error ?? "Insufficient balance" };
  }

  const addResult = await addCoins(receiverId, amount, { reason: "gift_received" });
  if (!addResult.success) {
    await addCoins(senderId, amount, { reason: "gift_refund" });
    return { success: false, error: "Failed to credit receiver" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.transaction.create({
      data: { senderId, receiverId, amount, type: "GIFT", giftType },
    });
  });

  const sender = await prisma.user.findUnique({ where: { id: senderId }, select: { name: true } });

  await handleUserActivity("gift_sent", { coins: amount, giftType });
  await handleUserActivity("gift_received", { coins: amount, giftType }, receiverId);

  const senderName = sender?.name ?? "Someone";
  await createNotification({
    userId: receiverId,
    type: "GIFT",
    title: "You received a gift!",
    message: `${senderName} sent you ${amount} coins`,
  });

  return {
    success: true,
    newBalance: spendResult.newBalance,
    senderName: senderName,
  };
}
