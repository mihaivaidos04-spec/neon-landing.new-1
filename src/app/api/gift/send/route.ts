import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { getWalletBalance, spendCoins, addCoins } from "@/src/lib/wallet";
import { prisma } from "@/src/lib/prisma";
import { createNotification } from "@/src/lib/create-notification";
import { bannedUserResponseIfAny } from "@/src/lib/banned-user";

export const GIFT_TYPES = { heart: 5, fire: 50, rocket: 500 } as const;
export type GiftType = keyof typeof GIFT_TYPES;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const senderId = (session as any)?.userId ?? session?.user?.id;
    if (!senderId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const banned = await bannedUserResponseIfAny(senderId);
    if (banned) return banned;

    const body = await req.json().catch(() => ({}));
    const receiverId = typeof body.receiverId === "string" ? body.receiverId : null;
    const giftType = typeof body.giftType === "string" && body.giftType in GIFT_TYPES ? (body.giftType as GiftType) : null;

    if (!receiverId || !giftType) {
      return NextResponse.json({ error: "Missing receiverId or giftType (heart|fire|rocket)" }, { status: 400 });
    }

    if (receiverId === senderId) {
      return NextResponse.json({ error: "Cannot send gift to yourself" }, { status: 400 });
    }

    const amount = GIFT_TYPES[giftType];
    const balance = await getWalletBalance(senderId);
    if (balance == null || balance < amount) {
      return NextResponse.json({ error: "Insufficient balance", required: amount }, { status: 400 });
    }

    const spendResult = await spendCoins(senderId, amount, "gift");
    if (!spendResult.success) {
      return NextResponse.json(
        { error: spendResult.error ?? "Insufficient balance", newBalance: spendResult.newBalance },
        { status: 400 }
      );
    }

    const addResult = await addCoins(receiverId, amount, { reason: "gift_received" });
    if (!addResult.success) {
      await addCoins(senderId, amount, { reason: "gift_refund" });
      return NextResponse.json({ error: "Failed to credit receiver" }, { status: 500 });
    }

    await prisma.transaction.create({
      data: {
        senderId,
        receiverId,
        amount,
        type: "GIFT",
        giftType,
      },
    });

    const sender = await prisma.user.findUnique({ where: { id: senderId }, select: { name: true } });
    const senderName = sender?.name ?? "Someone";

    await createNotification({
      userId: receiverId,
      type: "GIFT",
      title: "You received a gift!",
      message: `${senderName} sent you ${amount} coins`,
    });

    return NextResponse.json({
      success: true,
      newBalance: spendResult.newBalance,
      senderName,
      giftType,
      amount,
    });
  } catch (err) {
    console.error("[api/gift/send]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
