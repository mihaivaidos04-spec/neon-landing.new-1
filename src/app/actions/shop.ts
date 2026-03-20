"use server";

import { auth } from "@/src/auth";
import { getWalletBalance, spendCoins, addCoins } from "@/src/lib/wallet";
import { prisma } from "@/src/lib/prisma";
import { checkRateLimit } from "@/src/lib/rate-limit";
import { SHOP_ITEMS } from "@/src/lib/shop-items";

export type BuyResult =
  | { success: true; newBalance: number }
  | { success: false; error: string };

export async function buyItem(itemId: string): Promise<BuyResult> {
  const session = await auth();
  const userId = (session as { userId?: string })?.userId ?? (session?.user as { id?: string })?.id;
  if (!userId || typeof userId !== "string") {
    return { success: false, error: "Unauthorized" };
  }

  const { allowed } = checkRateLimit(userId, "gift");
  if (!allowed) {
    return { success: false, error: "Too many purchases. Please wait." };
  }

  const item = SHOP_ITEMS.find((i) => i.id === itemId);
  if (!item) {
    return { success: false, error: "Item not found" };
  }

  const balance = await getWalletBalance(userId);
  if (balance == null || balance < item.cost) {
    return { success: false, error: `Insufficient balance. Need ${item.cost} coins.` };
  }

  const spendResult = await spendCoins(userId, item.cost, "shop_purchase");
  if (!spendResult.success) {
    return { success: false, error: spendResult.error ?? "Insufficient balance" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.transaction.create({
        data: {
          senderId: userId,
          receiverId: userId,
          amount: item.cost,
          type: "PURCHASE",
          itemId: item.id,
        },
      });

      if (item.category === "status_boosts" && item.id === "ghost_24h" && item.durationHours) {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { ghostModeUntil: true },
        });
        const now = new Date();
        const expiresAt = new Date(now.getTime() + item.durationHours * 60 * 60 * 1000);
        const baseUntil = user?.ghostModeUntil && user.ghostModeUntil > now ? user.ghostModeUntil : now;
        const newUntil = new Date(baseUntil.getTime() + item.durationHours * 60 * 60 * 1000);

        await tx.user.update({
          where: { id: userId },
          data: { ghostModeUntil: newUntil, isGhost: true },
        });
      } else {
        await tx.userInventory.upsert({
          where: {
            userId_itemId: { userId, itemId: item.id },
          },
          create: {
            userId,
            itemId: item.id,
            itemType: item.category,
            quantity: 1,
          },
          update: {
            quantity: { increment: 1 },
          },
        });
      }
    });
  } catch (e) {
    console.error("[buyItem]", e);
    await addCoins(userId, item.cost, { reason: "shop_refund" });
    return { success: false, error: "Purchase failed" };
  }

  return { success: true, newBalance: spendResult.newBalance };
}
