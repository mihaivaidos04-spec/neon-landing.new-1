import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";

export const revalidate = 10;

export async function GET() {
  try {
    const session = await auth();
    const userId = (session as { userId?: string })?.userId ?? (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const goal = await prisma.creatorGoal.findUnique({
      where: { userId },
    });

    const received = await prisma.transaction.aggregate({
      where: { receiverId: userId, type: "GIFT" },
      _sum: { amount: true },
    });
    const totalReceived = received._sum.amount ?? 0;

    return NextResponse.json({
      goal: goal
        ? {
            id: goal.id,
            title: goal.title,
            targetCoins: goal.targetCoins,
            currentCoins: Math.min(goal.currentCoins + totalReceived, goal.targetCoins),
          }
        : null,
    });
  } catch (err) {
    console.error("[api/studio/goal]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    const userId = (session as { userId?: string })?.userId ?? (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const title = String(body.title ?? "Goal").slice(0, 100);
    const targetCoins = Math.max(1, parseInt(String(body.targetCoins ?? 1000), 10) || 1000);

    const goal = await prisma.creatorGoal.upsert({
      where: { userId },
      create: { userId, title, targetCoins, currentCoins: 0 },
      update: { title, targetCoins },
    });

    return NextResponse.json({ goal });
  } catch (err) {
    console.error("[api/studio/goal]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
