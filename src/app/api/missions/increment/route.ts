import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { incrementConnections, getStreakDays } from "@/src/lib/daily-quest";
import { insertGlobalNotification } from "@/src/lib/global-notifications";

const STREAK_FOR_NOTIFICATION = 7;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = (session as any)?.userId ?? session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const connectionDurationMs = typeof body.connectionDurationMs === "number"
      ? body.connectionDurationMs
      : parseInt(body.connectionDurationMs, 10) || 0;
    const result = await incrementConnections(userId, connectionDurationMs);

    if (result.justCompleted) {
      const streak = await getStreakDays(userId);
      if (streak >= STREAK_FOR_NOTIFICATION) {
        const userName =
          (session?.user?.name as string) ||
          (session?.user?.email as string)?.split("@")[0] ||
          `User${userId.slice(0, 8)}`;
        await insertGlobalNotification("streak_7", userName);
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/missions/increment]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
