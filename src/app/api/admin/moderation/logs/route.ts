import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { requireAdmin } from "@/src/lib/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!requireAdmin(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sp = req.nextUrl.searchParams;
    const severity = sp.get("severity")?.trim();
    const action = sp.get("action")?.trim();
    const from = sp.get("from");
    const to = sp.get("to");
    const limit = Math.min(parseInt(sp.get("limit") ?? "100", 10), 500);

    const where: {
      severity?: string;
      action?: string;
      createdAt?: { gte?: Date; lte?: Date };
    } = {};

    if (severity) where.severity = severity;
    if (action) where.action = action;
    if (from || to) {
      where.createdAt = {};
      if (from) {
        const d = new Date(from);
        if (!Number.isNaN(d.getTime())) where.createdAt.gte = d;
      }
      if (to) {
        const d = new Date(to);
        if (!Number.isNaN(d.getTime())) where.createdAt.lte = d;
      }
    }

    const logs = await prisma.moderationLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: { select: { email: true, name: true, nickname: true } },
      },
    });

    return NextResponse.json({
      logs: logs.map((l) => ({
        id: l.id,
        userId: l.userId,
        userEmail: l.user.email,
        userName: l.user.nickname ?? l.user.name,
        content: l.content,
        reason: l.reason,
        severity: l.severity,
        action: l.action,
        createdAt: l.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("[api/admin/moderation/logs]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
