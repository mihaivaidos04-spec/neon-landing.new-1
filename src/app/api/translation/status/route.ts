import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { getTranslationStatusForUser } from "@/src/lib/translation-user-status";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await auth();
    const userId =
      (session as { userId?: string })?.userId ?? (session?.user as { id?: string })?.id ?? undefined;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const status = await getTranslationStatusForUser(prisma, userId);
    if (!status) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(status);
  } catch (err) {
    console.error("[api/translation/status]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
