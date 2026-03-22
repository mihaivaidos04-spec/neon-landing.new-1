import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { parseNickname } from "@/src/lib/nickname";

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    const userId =
      (session as { userId?: string })?.userId ?? (session?.user as { id?: string })?.id ?? undefined;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = parseNickname(body?.nickname);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    try {
      await prisma.user.update({
        where: { id: userId },
        data: { nickname: parsed.value },
      });
    } catch (e: unknown) {
      const code = typeof e === "object" && e !== null && "code" in e ? (e as { code?: string }).code : undefined;
      if (code === "P2002") {
        return NextResponse.json({ error: "That nickname is already taken" }, { status: 409 });
      }
      throw e;
    }

    return NextResponse.json({ ok: true, nickname: parsed.value });
  } catch (err) {
    console.error("[api/user/nickname PATCH]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
