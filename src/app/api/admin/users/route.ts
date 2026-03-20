import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { requireAdmin } from "@/src/lib/admin";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!requireAdmin(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const search = req.nextUrl.searchParams.get("search") ?? "";
    const take = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "50", 10), 100);

    const users = await prisma.user.findMany({
      where: search
        ? {
            OR: [
              { email: { contains: search, mode: "insensitive" } },
              { name: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        name: true,
        email: true,
        coins: true,
        tier: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ users });
  } catch (err) {
    console.error("[api/admin/users]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
