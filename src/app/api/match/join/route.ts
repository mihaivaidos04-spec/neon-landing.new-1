import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { joinMatchPool } from "@/src/lib/matching";
import { getBatteryLevel } from "@/src/lib/battery";
import { getWalletBalance } from "@/src/lib/wallet";
import { TARGET_COUNTRY_MATCH_COST } from "@/src/lib/coins";
import { isPlausibleCountryCode } from "@/src/lib/valid-country-code";
import { isUserMatchingSuspended } from "@/src/lib/report-store";
import { checkMatchRateLimit } from "@/src/lib/rate-limit";
import { getPartnerNickname } from "@/src/lib/partner-nickname";
import { bannedUserResponseIfAny } from "@/src/lib/banned-user";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = (session as any)?.userId ?? session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const banned = await bannedUserResponseIfAny(userId);
    if (banned) return banned;

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

    const [dbSuspended, user] = await Promise.all([
      isUserMatchingSuspended(userId),
      prisma.user.findUnique({
        where: { id: userId },
        select: { isShadowBanned: true, systemSuspensionUntil: true, isVip: true },
      }),
    ]);
    if (dbSuspended || user?.isShadowBanned) {
      const until = user?.systemSuspensionUntil;
      const untilIso = until && until > new Date() ? until.toISOString() : null;
      return NextResponse.json(
        {
          error:
            "Your account is temporarily restricted (reports / moderation). Try again in about 1 hour or contact support.",
          suspendedUntil: untilIso,
        },
        { status: 403 }
      );
    }

    let filter: string | null = null;
    let targetCountryCode: string | null = null;
    try {
      const body = await req.json().catch(() => ({}));
      filter = body?.filter ?? null;
      const raw = body?.targetCountryCode;
      if (typeof raw === "string" && raw.trim().length >= 2) {
        const up = raw.trim().toUpperCase().slice(0, 2);
        if (isPlausibleCountryCode(up)) targetCountryCode = up;
      }
    } catch {
      // no body
    }

    /** Gender preference matching requires Neon VIP (User.isVip — Whale Pack). */
    if (filter === "female" || filter === "male") {
      if (user?.isVip !== true) {
        return NextResponse.json(
          {
            error: "Neon VIP is required to match by gender. Upgrade with the Whale Pack.",
            code: "NEON_VIP_REQUIRED",
          },
          { status: 403 }
        );
      }
    }

    if (targetCountryCode) {
      const balance = await getWalletBalance(userId);
      if ((balance ?? 0) < TARGET_COUNTRY_MATCH_COST) {
        return NextResponse.json(
          {
            error: `You need at least ${TARGET_COUNTRY_MATCH_COST} coins to match by target country.`,
            code: "INSUFFICIENT_COINS_COUNTRY_MATCH",
          },
          { status: 400 }
        );
      }
    }

    const result = await joinMatchPool(userId, filter, { targetCountryCode });
    if (result.status === "error") {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    let partnerNickname: string | null | undefined;
    if (result.status === "matched" && result.partnerId) {
      partnerNickname = await getPartnerNickname(result.partnerId);
    }

    return NextResponse.json({
      status: result.status,
      partnerId: result.status === "matched" ? result.partnerId : undefined,
      partnerNickname: result.status === "matched" ? partnerNickname ?? null : undefined,
      newBalance:
        result.status === "matched" && result.newBalance != null
          ? result.newBalance
          : undefined,
    });
  } catch (err) {
    console.error("[api/match/join]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
