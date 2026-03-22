import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { maybeApplyReportAutoSuspension } from "@/src/lib/report-store";
import { prisma } from "@/src/lib/prisma";

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

    if (reporterId === reportedUserId) {
      return NextResponse.json({ error: "Cannot report yourself" }, { status: 400 });
    }

    await prisma.report.create({
      data: { reporterId, reportedUserId, reason, status: "pending" },
    });

    await maybeApplyReportAutoSuspension(reportedUserId);

    return NextResponse.json({ ok: true, message: "Report submitted" });
  } catch (err) {
    console.error("[api/report]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
