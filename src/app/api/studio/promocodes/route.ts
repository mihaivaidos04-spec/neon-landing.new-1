import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";

export const revalidate = 30;

export async function GET() {
  try {
    const session = await auth();
    const userId = (session as { userId?: string })?.userId ?? (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const codes = await prisma.promocode.findMany({
      where: { creatorId: userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ promocodes: codes });
  } catch (err) {
    console.error("[api/studio/promocodes]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = (session as { userId?: string })?.userId ?? (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const code = String(body.code ?? "").toUpperCase().replace(/\s/g, "");
    const bonusPercent = Math.min(50, Math.max(5, parseInt(String(body.bonusPercent ?? 10), 10) || 10));

    if (!code || code.length < 4) {
      return NextResponse.json({ error: "Code must be at least 4 characters" }, { status: 400 });
    }

    const existing = await prisma.promocode.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: "Code already exists" }, { status: 400 });
    }

    const created = await prisma.promocode.create({
      data: { creatorId: userId, code, bonusPercent },
    });

    return NextResponse.json({ promocode: created });
  } catch (err) {
    console.error("[api/studio/promocodes]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
