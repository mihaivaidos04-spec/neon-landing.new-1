import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { requireAdmin } from "@/src/lib/admin";

export const runtime = "nodejs";

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

export async function GET() {
  try {
    const session = await auth();
    if (!requireAdmin(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const dayStart = startOfUtcDay(now);

    const [blockedToday, warnedToday, bannedToday, timedBanCount, tierBannedCount] = await Promise.all([
      prisma.moderationLog.count({
        where: { action: "blocked", createdAt: { gte: dayStart } },
      }),
      prisma.moderationLog.count({
        where: { action: "warned", createdAt: { gte: dayStart } },
      }),
      prisma.moderationLog.count({
        where: { action: "banned", createdAt: { gte: dayStart } },
      }),
      prisma.user.count({
        where: { bannedUntil: { gt: now } },
      }),
      prisma.user.count({
        where: { tier: "BANNED" },
      }),
    ]);

    return NextResponse.json({
      blockedToday,
      warnedToday,
      bannedToday,
      activeTimedBans: timedBanCount,
      permanentBannedUsers: tierBannedCount,
    });
  } catch (err) {
    console.error("[api/admin/moderation/stats]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
