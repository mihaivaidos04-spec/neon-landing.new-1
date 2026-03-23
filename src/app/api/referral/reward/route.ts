import { NextRequest, NextResponse } from "next/server";
import { rewardReferrerOnReferredPurchase } from "@/src/lib/referral-service";

export const runtime = "nodejs";

/**
 * POST /api/referral/reward — internal: grant referrer bonus when referred user purchases.
 * Requires header Authorization: Bearer REFERRAL_REWARD_SECRET (same value in env).
 * Body: { "userId": "<buyer user id>" }
 */
export async function POST(req: NextRequest) {
  try {
    const secret = process.env.REFERRAL_REWARD_SECRET?.trim();
    if (!secret) {
      return NextResponse.json({ error: "Not configured" }, { status: 503 });
    }

    const authz = req.headers.get("authorization") ?? "";
    const token = authz.startsWith("Bearer ") ? authz.slice(7).trim() : "";
    if (token !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const userId = typeof body?.userId === "string" ? body.userId.trim() : "";
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const { granted } = await rewardReferrerOnReferredPurchase(userId);
    return NextResponse.json({ granted });
  } catch (err) {
    console.error("[api/referral/reward]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
