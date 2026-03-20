import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { getUserAnalytics } from "@/src/lib/creator-analytics";

const COINS_TO_EUR = 0.01;
const PLATFORM_FEE = 0.2;
const MIN_PAYOUT_EUR = 50;

export const revalidate = 30;

export async function GET() {
  try {
    const session = await auth();
    const userId = (session as { userId?: string })?.userId ?? (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const analytics = await getUserAnalytics(userId);
    const pendingEur = analytics.netRevenue;

    const payouts = await prisma.creatorPayout.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      pendingBalance: pendingEur,
      canRequestPayout: pendingEur >= MIN_PAYOUT_EUR,
      minPayout: MIN_PAYOUT_EUR,
      payouts: payouts.map((p) => ({
        id: p.id,
        amountEur: Number(p.amountEur),
        status: p.status,
        paidAt: p.paidAt?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("[api/studio/payouts]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
