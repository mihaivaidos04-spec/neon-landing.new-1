import { NextResponse } from "next/server";
import { auth } from "@/src/auth";

/** Lightweight session probe (legacy clients expected JSON). */
export async function GET() {
  try {
    const session = await auth();
    const userId = (session as { userId?: string })?.userId ?? session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/me]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
