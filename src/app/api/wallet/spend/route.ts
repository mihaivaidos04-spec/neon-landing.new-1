import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { spendCoins } from "@/src/lib/wallet";
import { prisma } from "@/src/lib/prisma";
import { bannedUserResponseIfAny } from "@/src/lib/banned-user";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = (session as any)?.userId ?? session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const banned = await bannedUserResponseIfAny(userId);
    if (banned) return banned;
    const body = await req.json().catch(() => ({}));
    const amount = typeof body.amount === "number" ? body.amount : parseInt(body.amount, 10);
    const reason = typeof body.reason === "string" ? body.reason : undefined;
    if (!Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    const result = await spendCoins(userId, amount, reason);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? "Insufficient balance", newBalance: result.newBalance },
        { status: 400 }
      );
    }
    // Update Prisma User.totalCoinsSpent
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { totalCoinsSpent: { increment: amount } },
      });
    } catch (e) {
      console.error("[api/wallet/spend] totalCoinsSpent update", e);
    }
    return NextResponse.json({ success: true, newBalance: result.newBalance });
  } catch (err) {
    console.error("[api/wallet/spend]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
