import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { maybeNotifyVipPassExpiringSoon } from "@/src/lib/vip-pass-expiry-notification";

export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userId = (session as { userId?: string })?.userId ?? (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await maybeNotifyVipPassExpiringSoon(userId);

    const limit = Math.min(50, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") ?? "10", 10) || 10));

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, read: false },
    });

    return NextResponse.json({
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.read,
        link: n.link,
        createdAt: n.createdAt.toISOString(),
      })),
      unreadCount,
    });
  } catch (err) {
    console.error("[api/notifications GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
