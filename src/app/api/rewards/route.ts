import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { getPendingRewardsCount } from "@/src/lib/rewards";

export async function GET() {
  try {
    const session = await auth();
    const userId = (session as any)?.userId ?? session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const pendingCount = await getPendingRewardsCount(userId);
    return NextResponse.json({ pendingCount });
  } catch (err) {
    console.error("[api/rewards GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
