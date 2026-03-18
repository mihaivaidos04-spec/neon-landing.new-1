import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { incrementMessages } from "@/src/lib/daily-quest";

export async function POST() {
  try {
    const session = await auth();
    const userId = (session as any)?.userId ?? session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const result = await incrementMessages(userId);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/missions/increment-messages]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
