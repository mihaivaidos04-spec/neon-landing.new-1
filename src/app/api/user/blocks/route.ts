import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";

export const runtime = "nodejs";

/** GET /api/user/blocks — users you have blocked (for profile settings). */
export async function GET() {
  try {
    const session = await auth();
    const blockerId =
      (session as { userId?: string })?.userId ?? (session?.user as { id?: string })?.id ?? undefined;
    if (!blockerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await prisma.userBlock.findMany({
      where: { blockerId },
      orderBy: { createdAt: "desc" },
      select: {
        blockedId: true,
        blocked: { select: { nickname: true, name: true } },
      },
    });

    const blocked = rows.map((r) => ({
      userId: r.blockedId,
      displayName:
        r.blocked.nickname?.trim() ||
        r.blocked.name?.trim() ||
        "Utilizator",
    }));

    return NextResponse.json({ blocked });
  } catch (err) {
    console.error("[api/user/blocks GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
