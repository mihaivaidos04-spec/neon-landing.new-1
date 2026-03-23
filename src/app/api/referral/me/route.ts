import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { getPublicSiteOrigin } from "@/src/lib/public-site-url";

export const runtime = "nodejs";

function sessionUserId(session: unknown): string | undefined {
  const s = session as { userId?: string; user?: { id?: string } } | null | undefined;
  return s?.userId ?? s?.user?.id;
}

export async function GET() {
  try {
    const session = await auth();
    const userId = sessionUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        referralCode: true,
        referralCount: true,
        referralCoins: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!user.referralCode?.trim()) {
      for (let i = 0; i < 5; i++) {
        const code = randomUUID();
        try {
          user = await prisma.user.update({
            where: { id: userId },
            data: { referralCode: code },
            select: {
              referralCode: true,
              referralCount: true,
              referralCoins: true,
            },
          });
          break;
        } catch {
          /* collision — retry */
        }
      }
    }
    if (!user?.referralCode) {
      return NextResponse.json({ error: "Could not assign referral code" }, { status: 500 });
    }

    const origin = getPublicSiteOrigin();
    const link = `${origin}?ref=${encodeURIComponent(user.referralCode)}`;

    return NextResponse.json({
      referralCode: user.referralCode,
      referralLink: link,
      referralCount: user.referralCount ?? 0,
      referralCoins: user.referralCoins ?? 0,
    });
  } catch (err) {
    console.error("[api/referral/me]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
