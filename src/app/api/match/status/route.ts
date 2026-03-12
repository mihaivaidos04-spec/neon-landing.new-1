import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { getMatchStatus } from "@/src/lib/matching";

export async function GET() {
  try {
    const session = await auth();
    const userId = (session as any)?.userId ?? session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await getMatchStatus(userId);
    return NextResponse.json({
      status: result.status,
      partnerId: result.status === "matched" ? result.partnerId : undefined,
    });
  } catch (err) {
    console.error("[api/match/status]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
