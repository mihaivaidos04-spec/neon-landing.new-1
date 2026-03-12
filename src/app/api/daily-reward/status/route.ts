import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { getDailyRewardStatus } from "@/src/lib/daily-reward";

export async function GET() {
  try {
    const session = await auth();
    const userId = (session as any)?.userId ?? session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const status = await getDailyRewardStatus(userId);

    return NextResponse.json(status);
  } catch (err) {
    console.error("[api/daily-reward/status]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
