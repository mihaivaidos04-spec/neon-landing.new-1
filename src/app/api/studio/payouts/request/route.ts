import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { getUserAnalytics } from "@/src/lib/creator-analytics";

const MIN_PAYOUT_EUR = 50;

export async function POST() {
  try {
    const session = await auth();
    const userId = (session as { userId?: string })?.userId ?? (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const analytics = await getUserAnalytics(userId);
    const existingPayouts = await prisma.creatorPayout.findMany({
      where: { userId },
      select: { amountEur: true },
    });
    const totalPaidOut = existingPayouts.reduce((s, p) => s + Number(p.amountEur), 0);
    const pendingBalance = Math.max(0, analytics.netRevenue - totalPaidOut);

    if (pendingBalance < MIN_PAYOUT_EUR) {
      return NextResponse.json(
        { error: `Minimum payout is ${MIN_PAYOUT_EUR}€. Available: €${pendingBalance.toFixed(2)}` },
        { status: 400 }
      );
    }

    await prisma.creatorPayout.create({
      data: {
        userId,
        amountEur: pendingBalance,
        status: "pending",
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/studio/payouts/request]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
