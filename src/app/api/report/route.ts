import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { addReport } from "@/src/lib/report-store";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const reporterId = (session as any)?.userId ?? session?.user?.id ?? `guest-${Date.now()}`;

    const body = await req.json().catch(() => ({}));
    const reportedUserId = body?.reportedUserId ?? body?.partnerId;
    if (!reportedUserId || typeof reportedUserId !== "string") {
      return NextResponse.json({ error: "Missing reportedUserId" }, { status: 400 });
    }

    if (reporterId === reportedUserId) {
      return NextResponse.json({ error: "Cannot report yourself" }, { status: 400 });
    }

    await addReport(reportedUserId);

    return NextResponse.json({ ok: true, message: "Report submitted" });
  } catch (err) {
    console.error("[api/report]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
