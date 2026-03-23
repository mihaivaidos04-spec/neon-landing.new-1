import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { requireAdmin } from "@/src/lib/admin";

export const runtime = "nodejs";

/**
 * Clears automatic timed ban (`bannedUntil`). Does not change `tier` (permanent BANNED stays unless changed elsewhere).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!requireAdmin(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const userId = typeof body.userId === "string" ? body.userId.trim() : "";
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { bannedUntil: null },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/admin/moderation/lift-ban]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
