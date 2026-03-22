import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";

export const runtime = "nodejs";

/**
 * POST /api/user/block — block a user (no more random matches together).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const blockerId =
      (session as { userId?: string })?.userId ?? (session?.user as { id?: string })?.id;
    if (!blockerId) {
      return NextResponse.json({ error: "Sign in to block users" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const blockedId = typeof body?.blockedUserId === "string" ? body.blockedUserId.trim() : "";
    if (!blockedId) {
      return NextResponse.json({ error: "Missing blockedUserId" }, { status: 400 });
    }
    if (blockedId === blockerId) {
      return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id: blockedId }, select: { id: true } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.userBlock.upsert({
      where: {
        blockerId_blockedId: { blockerId, blockedId },
      },
      create: { blockerId, blockedId },
      update: {},
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/user/block]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
