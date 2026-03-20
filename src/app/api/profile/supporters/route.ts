import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    const userId = (session as { userId?: string })?.userId ?? (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supporters = await prisma.transaction.groupBy({
      by: ["senderId"],
      where: { receiverId: userId, type: "GIFT" },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 10,
    });

    const senderIds = supporters.map((s) => s.senderId).filter(Boolean);
    const users = await prisma.user.findMany({
      where: { id: { in: senderIds } },
      select: { id: true, name: true, image: true, country: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const list = supporters.map((s) => ({
      userId: s.senderId,
      totalSent: s._sum.amount ?? 0,
      name: userMap.get(s.senderId)?.name ?? "Anonymous",
      image: userMap.get(s.senderId)?.image ?? null,
      countryCode: userMap.get(s.senderId)?.country ?? null,
    }));

    return NextResponse.json({ supporters: list });
  } catch (err) {
    console.error("[api/profile/supporters]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
