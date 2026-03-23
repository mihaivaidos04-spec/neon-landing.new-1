import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";

export const runtime = "nodejs";

/**
 * DELETE /api/user/block/[userId] — unblock (remove row where current user is blocker).
 */
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    const blockerId =
      (session as { userId?: string })?.userId ?? (session?.user as { id?: string })?.id ?? undefined;
    if (!blockerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId: blockedId } = await context.params;
    if (!blockedId || blockedId === blockerId) {
      return NextResponse.json({ error: "Invalid user" }, { status: 400 });
    }

    try {
      await prisma.userBlock.delete({
        where: {
          blockerId_blockedId: { blockerId, blockedId },
        },
      });
    } catch (e: unknown) {
      const code = typeof e === "object" && e !== null && "code" in e ? (e as { code?: string }).code : undefined;
      if (code === "P2025") {
        return NextResponse.json({ error: "Not blocked" }, { status: 404 });
      }
      throw e;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/user/block/[userId] DELETE]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
