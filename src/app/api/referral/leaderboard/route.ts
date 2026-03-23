import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export const runtime = "nodejs";

/**
 * Top referrers by number of Referral rows created in the current UTC month.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const y = parseInt(searchParams.get("year") ?? "", 10);
    const m = parseInt(searchParams.get("month") ?? "", 10);
    const now = new Date();
    const year = Number.isFinite(y) ? y : now.getUTCFullYear();
    const month = Number.isFinite(m) ? Math.min(12, Math.max(1, m)) : now.getUTCMonth() + 1;

    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

    const rows = await prisma.referral.groupBy({
      by: ["referrerId"],
      where: {
        createdAt: { gte: start, lt: end },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 20,
    });

    const ids = rows.map((r) => r.referrerId);
    const users = await prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, nickname: true, name: true, image: true },
    });
    const byId = new Map(users.map((u) => [u.id, u]));

    const leaderboard = rows.map((r, i) => {
      const u = byId.get(r.referrerId);
      const label = u?.nickname?.trim() || u?.name?.trim() || "Neon user";
      return {
        rank: i + 1,
        userId: r.referrerId,
        displayName: label,
        image: u?.image ?? null,
        invites: r._count.id,
      };
    });

    return NextResponse.json({
      year,
      month,
      start: start.toISOString(),
      leaderboard,
    });
  } catch (err) {
    console.error("[api/referral/leaderboard]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
