import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";

export async function POST() {
  try {
    const session = await auth();
    const userId = (session as { userId?: string })?.userId ?? (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.notification.updateMany({
      where: { userId },
      data: { read: true },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/notifications/read-all POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
