import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/leaderboard/top-supporters
 * Top 5 users by lifetime coins spent (wallet spend), for public sidebar.
 */
export async function GET() {
  try {
    const rows = await prisma.user.findMany({
      where: { totalCoinsSpent: { gt: 0 } },
      orderBy: { totalCoinsSpent: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        image: true,
        country: true,
        totalCoinsSpent: true,
      },
    });

    const supporters = rows.map((r, i) => ({
      rank: i + 1,
      userId: r.id,
      name: r.name?.trim() || "Supporter",
      image: r.image,
      countryCode: r.country,
      totalCoinsSpent: r.totalCoinsSpent,
    }));

    return NextResponse.json({ supporters });
  } catch (e) {
    console.error("[api/leaderboard/top-supporters]", e);
    return NextResponse.json({ supporters: [], error: "failed" }, { status: 500 });
  }
}
