import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());

async function isAdmin(): Promise<boolean> {
  const session = await auth();
  const email = (session?.user as { email?: string })?.email?.toLowerCase();
  return !!email && ADMIN_EMAILS.includes(email);
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const reports = await prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        reported: { select: { id: true, name: true, email: true, isShadowBanned: true } },
      },
    });
    return NextResponse.json({ reports });
  } catch (err) {
    console.error("[api/admin/reports]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const reportId = body?.reportId;

    if (!reportId || typeof reportId !== "string") {
      return NextResponse.json({ error: "Missing reportId" }, { status: 400 });
    }

    const status = body?.status as string | undefined;
    const adminNotes = body?.adminNotes as string | undefined;
    const shadowBanUser = body?.shadowBanUser === true;

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: { reported: true },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const updates: { status?: string; adminNotes?: string; reviewedAt?: Date } = {};
    if (status && ["pending", "reviewed", "dismissed", "action_taken"].includes(status)) {
      updates.status = status;
      updates.reviewedAt = new Date();
    }
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;

    await prisma.report.update({
      where: { id: reportId },
      data: updates,
    });

    if (shadowBanUser) {
      await prisma.user.update({
        where: { id: report.reportedUserId },
        data: { isShadowBanned: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/admin/reports]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
