import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WINDOW_MS = 24 * 60 * 60 * 1000;
const LIMIT = 50;

/**
 * GET /api/trending/received-24h
 * Public: ranks users by sum of GIFT transaction amounts received in the last 24 hours.
 */
export async function GET() {
  try {
    const since = new Date(Date.now() - WINDOW_MS);

    const grouped = await prisma.transaction.groupBy({
      by: ["receiverId"],
      where: {
        type: "GIFT",
        createdAt: { gte: since },
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: LIMIT,
    });

    const receiverIds = grouped.map((g) => g.receiverId);
    if (receiverIds.length === 0) {
      return NextResponse.json({
        updatedAt: new Date().toISOString(),
        windowHours: 24,
        trending: [],
      });
    }

    const users = await prisma.user.findMany({
      where: { id: { in: receiverIds } },
      select: {
        id: true,
        name: true,
        image: true,
        country: true,
        isShadowBanned: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const rows = grouped
      .map((row) => {
        const u = userMap.get(row.receiverId);
        if (!u || u.isShadowBanned) return null;
        const coins = row._sum.amount ?? 0;
        if (coins <= 0) return null;
        return {
          userId: row.receiverId,
          name: u.name?.trim() || "Neon user",
          image: u.image,
          countryCode: u.country,
          coinsReceived: coins,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x != null);

    const trending = rows.map((row, i) => ({
      rank: i + 1,
      ...row,
    }));

    return NextResponse.json({
      updatedAt: new Date().toISOString(),
      windowHours: 24,
      trending,
    });
  } catch (err) {
    console.error("[api/trending/received-24h]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
