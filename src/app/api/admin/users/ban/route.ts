import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { requireAdmin } from "@/src/lib/admin";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!requireAdmin(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const userId = typeof body.userId === "string" ? body.userId : null;

    if (!userId) {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { tier: "BANNED" },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/admin/users/ban]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
