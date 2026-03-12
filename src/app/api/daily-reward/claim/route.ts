import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { claimDailyReward } from "@/src/lib/daily-reward";

export async function POST() {
  try {
    const session = await auth();
    const userId = (session as any)?.userId ?? session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await claimDailyReward(userId);

    return NextResponse.json({
      claimed: result.claimed,
      battery: result.battery,
      streak: result.streak,
      goldBadge: result.goldBadge,
      goldBadgeExpiresAt: result.goldBadgeExpiresAt,
    });
  } catch (err) {
    console.error("[api/daily-reward/claim]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
