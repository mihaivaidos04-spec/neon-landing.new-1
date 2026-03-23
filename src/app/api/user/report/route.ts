import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { maybeApplyReportAutoSuspension } from "@/src/lib/report-store";
import { prisma } from "@/src/lib/prisma";
import { bannedUserResponseIfAny } from "@/src/lib/banned-user";
import { applyReportAiTriage } from "@/src/lib/report-ai-triage";

export const runtime = "nodejs";

const DETAILS_MAX = 2000;

const ALLOWED_REASONS = new Set([
  "inappropriate_behavior",
  "spam_ads",
  "offensive_language",
  "explicit_content",
  "other",
]);

/**
 * POST /api/user/report — same behavior as /api/report, plus optional `details`.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const reporterId =
      (session as { userId?: string })?.userId ?? (session?.user as { id?: string })?.id ?? undefined;

    const body = await req.json().catch(() => ({}));
    const reportedUserId =
      (typeof body?.reportedUserId === "string" && body.reportedUserId.trim()) ||
      (typeof body?.reportedId === "string" && body.reportedId.trim()) ||
      (typeof body?.partnerId === "string" && body.partnerId.trim()) ||
      "";

    let reason =
      typeof body?.reason === "string" && body.reason.trim()
        ? body.reason.trim()
        : "inappropriate_behavior";
    if (!ALLOWED_REASONS.has(reason)) {
      reason = "other";
    }

    const detailsRaw = typeof body?.details === "string" ? body.details.trim().slice(0, DETAILS_MAX) : "";
    const details = detailsRaw || null;

    if (!reportedUserId) {
      return NextResponse.json({ error: "Missing reportedUserId" }, { status: 400 });
    }

    if (!reporterId) {
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
    console.error("[api/user/report]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
