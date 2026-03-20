import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { getUserAnalytics } from "@/src/lib/creator-analytics";

export const revalidate = 60;

export async function GET() {
  try {
    const session = await auth();
    const userId = (session as { userId?: string })?.userId ?? (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const analytics = await getUserAnalytics(userId);
    return NextResponse.json(analytics);
  } catch (err) {
    console.error("[api/studio/analytics]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
