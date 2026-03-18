import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    const userId = (session as any)?.userId ?? session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { hasEverPurchased: true },
    });

    return NextResponse.json({
      hasEverPurchased: user?.hasEverPurchased ?? false,
    });
  } catch (err) {
    console.error("[api/me]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
