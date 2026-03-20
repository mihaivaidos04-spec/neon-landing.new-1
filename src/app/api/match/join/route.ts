import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { joinMatchPool } from "@/src/lib/matching";
import { getWalletBalance } from "@/src/lib/wallet";
import { getBatteryLevel } from "@/src/lib/battery";
import { isUserShadowBanned, isUserMatchingSuspended } from "@/src/lib/report-store";
import { checkMatchRateLimit } from "@/src/lib/rate-limit";

const GENDER_FILTER_MIN_COINS = 5;

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = (session as any)?.userId ?? session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const battery = await getBatteryLevel(userId);
    if (battery <= 0) {
      return NextResponse.json(
        { error: "Battery depleted. Please recharge to continue matching." },
        { status: 403 }
      );
    }

    const rateLimit = await checkMatchRateLimit(userId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before clicking Next again.", retryAfterMs: rateLimit.retryAfterMs },
        { status: 429 }
      );
    }

    const [shadowBanned, dbSuspended, user] = await Promise.all([
      Promise.resolve(isUserShadowBanned(userId)),
      isUserMatchingSuspended(userId),
      prisma.user.findUnique({ where: { id: userId }, select: { isShadowBanned: true } }),
    ]);
    if (shadowBanned || dbSuspended || user?.isShadowBanned) {
      return NextResponse.json(
        { error: "Your account is temporarily restricted due to reports. Please try again in 24 hours." },
        { status: 403 }
      );
    }

    let filter: string | null = null;
    try {
      const body = await req.json().catch(() => ({}));
      filter = body?.filter ?? null;
    } catch {
      // no body
    }

    if (filter === "female" || filter === "male") {
      const balance = await getWalletBalance(userId);
      if ((balance ?? 0) < GENDER_FILTER_MIN_COINS) {
        return NextResponse.json(
          { error: `Minimum ${GENDER_FILTER_MIN_COINS} coins required for gender filter` },
          { status: 400 }
        );
      }
    }

    const result = await joinMatchPool(userId, filter);
    if (result.status === "error") {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      status: result.status,
      partnerId: result.status === "matched" ? result.partnerId : undefined,
    });
  } catch (err) {
    console.error("[api/match/join]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
