import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = (session as { userId?: string })?.userId ?? (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const single = typeof body.id === "string" ? body.id : null;
    const ids = Array.isArray(body.ids) ? body.ids.filter((x: unknown) => typeof x === "string") : [];
    const targetIds = single ? [single] : ids;
    if (targetIds.length === 0) {
      return NextResponse.json({ error: "Missing id or ids" }, { status: 400 });
    }

    await prisma.notification.updateMany({
      where: { userId, id: { in: targetIds } },
      data: { read: true },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/notifications/read POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
