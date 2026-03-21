import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userId = (session as { userId?: string })?.userId ?? (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const days = parseInt(req.nextUrl.searchParams.get("days") ?? "365", 10);
    const start = new Date();
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);

    const logs = await prisma.activityLog.findMany({
      where: { userId, createdAt: { gte: start } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true, activityType: true, xpEarned: true },
    });

    const byDate: Record<string, number> = {};
    const dayStats: Record<
      string,
      { xp: number; logins: number; giftsSent: number; giftsReceived: number; globalChats: number }
    > = {};

    for (const log of logs) {
      const key = log.createdAt.toISOString().slice(0, 10);
      byDate[key] = (byDate[key] ?? 0) + log.xpEarned;
      if (!dayStats[key]) {
        dayStats[key] = { xp: 0, logins: 0, giftsSent: 0, giftsReceived: 0, globalChats: 0 };
      }
      dayStats[key].xp += log.xpEarned;
      if (log.activityType === "login") dayStats[key].logins += 1;
      if (log.activityType === "gift_sent") dayStats[key].giftsSent += 1;
      if (log.activityType === "gift_received") dayStats[key].giftsReceived += 1;
      if (log.activityType === "global_chat") dayStats[key].globalChats += 1;
    }

    return NextResponse.json({ activity: byDate, dayStats });
  } catch (err) {
    console.error("[api/profile/activity]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
