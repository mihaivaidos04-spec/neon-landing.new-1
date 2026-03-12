import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { saveAttribution } from "@/src/lib/attribution";

/**
 * Saves stored UTM + ref attribution to user profile.
 * Called when user is authenticated; client sends data from localStorage.
 * Only updates on first attribution (signup_source/referred_by_id not yet set).
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = (session as any)?.userId ?? session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const attribution = {
      utm_source: body?.utm_source as string | undefined,
      utm_medium: body?.utm_medium as string | undefined,
      utm_campaign: body?.utm_campaign as string | undefined,
      ref: body?.ref as string | undefined,
    };

    const result = await saveAttribution(userId, attribution);
    return NextResponse.json({ saved: result.saved, error: result.error });
  } catch (err) {
    console.error("[api/attribution/save]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
