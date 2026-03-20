import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export const revalidate = 10;

const PER_PAGE = 20;

export async function GET(req: NextRequest) {
  try {
    const page = Math.max(0, parseInt(req.nextUrl.searchParams.get("page") ?? "0", 10));
    const skip = page * PER_PAGE;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { isShadowBanned: false },
        select: { id: true, name: true, country: true, currentLevel: true },
        orderBy: { lastLogin: "desc" },
        skip,
        take: PER_PAGE,
      }),
      prisma.user.count({ where: { isShadowBanned: false } }),
    ]);

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        name: u.name ?? "Anonymous",
        country: u.country ?? "XX",
        level: u.currentLevel,
      })),
      hasMore: skip + users.length < total,
      total,
    });
  } catch (err) {
    console.error("[api/live-users]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
