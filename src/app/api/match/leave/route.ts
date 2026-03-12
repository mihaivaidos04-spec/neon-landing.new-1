import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { leaveMatchPool } from "@/src/lib/matching";

export async function POST() {
  try {
    const session = await auth();
    const userId = (session as any)?.userId ?? session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await leaveMatchPool(userId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/match/leave]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
