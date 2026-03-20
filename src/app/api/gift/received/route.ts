import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";

const GIFT_NAMES: Record<string, string> = { heart: "Heart", fire: "Fire", rocket: "Rocket" };

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userId = (session as any)?.userId ?? session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const since = req.nextUrl.searchParams.get("since");
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000);

    const transactions = await prisma.transaction.findMany({
      where: {
        receiverId: userId,
        type: "GIFT",
        createdAt: { gte: sinceDate },
      },
      orderBy: { createdAt: "asc" },
      take: 50,
      include: {
        sender: { select: { name: true } },
      },
    });

    const items = transactions.map((t) => ({
      id: t.id,
      senderName: t.sender?.name ?? "Someone",
      giftType: t.giftType ?? "heart",
      giftName: GIFT_NAMES[t.giftType ?? "heart"] ?? "Gift",
      amount: t.amount,
      createdAt: t.createdAt.toISOString(),
    }));

    return NextResponse.json({ transactions: items });
  } catch (err) {
    console.error("[api/gift/received]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
