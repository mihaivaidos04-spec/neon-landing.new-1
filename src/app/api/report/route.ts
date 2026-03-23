import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { maybeApplyReportAutoSuspension } from "@/src/lib/report-store";
import { prisma } from "@/src/lib/prisma";
import { bannedUserResponseIfAny } from "@/src/lib/banned-user";
import { applyReportAiTriage } from "@/src/lib/report-ai-triage";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const reporterId = (session as { userId?: string })?.userId ?? (session?.user as { id?: string })?.id;

    const body = await req.json().catch(() => ({}));
    const reportedUserId = body?.reportedUserId ?? body?.partnerId;
    const reason = typeof body?.reason === "string" ? body.reason : "inappropriate_behavior";
    if (!reportedUserId || typeof reportedUserId !== "string") {
      return NextResponse.json({ error: "Missing reportedUserId" }, { status: 400 });
    }

    if (!reporterId || typeof reporterId !== "string") {
      return NextResponse.json({ error: "Sign in to report" }, { status: 401 });
    }

    const banned = await bannedUserResponseIfAny(reporterId);
    if (banned) return banned;

    if (reporterId === reportedUserId) {
      return NextResponse.json({ error: "Cannot report yourself" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id: reportedUserId }, select: { id: true } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const detailsRaw =
      typeof body?.details === "string" ? body.details.trim().slice(0, 2000) : "";
    const details = detailsRaw || null;

    const created = await prisma.report.create({
      data: {
        reporterId,
        reportedUserId,
        reason,
        details,
        status: "pending",
        resolved: false,
      },
    });

    await applyReportAiTriage(created.id, reason, details);

    await maybeApplyReportAutoSuspension(reportedUserId);

    return NextResponse.json({ ok: true, message: "Report submitted" });
  } catch (err) {
    console.error("[api/report]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
