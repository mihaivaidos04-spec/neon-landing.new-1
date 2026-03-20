import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { requireAdmin } from "@/src/lib/admin";

export async function GET() {
  try {
    const session = await auth();
    if (!requireAdmin(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const days = 30;
    const start = new Date();
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);

    const users = await prisma.user.findMany({
      where: { createdAt: { gte: start } },
      select: { createdAt: true },
    });

    const byDate: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      d.setHours(0, 0, 0, 0);
      byDate[d.toISOString().slice(0, 10)] = 0;
    }

    for (const u of users) {
      const key = u.createdAt.toISOString().slice(0, 10);
      if (byDate[key] !== undefined) byDate[key]++;
    }

    const data = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[api/admin/user-growth]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
