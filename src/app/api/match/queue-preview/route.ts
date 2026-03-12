import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { getQueuePreview } from "@/src/lib/matching";

export async function GET() {
  try {
    const session = await auth();
    const userId = (session as any)?.userId ?? session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await getQueuePreview(userId, 3);
    return NextResponse.json({ users });
  } catch (err) {
    console.error("[api/match/queue-preview]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
