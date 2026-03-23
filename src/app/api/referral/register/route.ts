import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { registerReferral } from "@/src/lib/referral-service";

export const runtime = "nodejs";

function sessionUserId(session: unknown): string | undefined {
  const s = session as { userId?: string; user?: { id?: string } } | null | undefined;
  return s?.userId ?? s?.user?.id;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = sessionUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const code = typeof body?.code === "string" ? body.code : "";
    if (!code.trim()) {
      return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }

    const result = await registerReferral(userId, code);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    if (!result.applied) {
      return NextResponse.json({
        applied: false,
        reason: result.reason,
      });
    }

    return NextResponse.json({ applied: true });
  } catch (err) {
    console.error("[api/referral/register]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
