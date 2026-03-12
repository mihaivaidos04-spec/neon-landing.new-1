import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { getMissionProgress } from "@/src/lib/missions";

export async function GET() {
  try {
    const session = await auth();
    const userId = (session as any)?.userId ?? session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const progress = await getMissionProgress(userId);
    return NextResponse.json(progress);
  } catch (err) {
    console.error("[api/missions GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
