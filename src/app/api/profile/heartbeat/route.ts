import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";

const MIN_INTERVAL_MS = 55_000;

/** Throttled: ~1 minute of `totalOnlineMinutes` per interval while the tab calls this. */
export async function POST() {
  try {
    const session = await auth();
    const userId =
      (session as { userId?: string })?.userId ?? (session?.user as { id?: string })?.id ?? undefined;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profileHeartbeatAt: true },
    });
    const last = user?.profileHeartbeatAt?.getTime() ?? 0;
    if (now.getTime() - last < MIN_INTERVAL_MS) {
      return NextResponse.json({ ok: true, counted: false });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        profileHeartbeatAt: now,
        totalOnlineMinutes: { increment: 1 },
      },
    });

    return NextResponse.json({ ok: true, counted: true });
  } catch (err) {
    console.error("[api/profile/heartbeat]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
