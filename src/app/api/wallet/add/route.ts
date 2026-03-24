import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { addCoins } from "@/src/lib/wallet";
import { checkRateLimit } from "@/src/lib/rate-limit";

/**
 * Add coins to wallet (in-app grants: quests, bonuses). Rate-limited.
 * Pass `externalId` for idempotent grants.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = (session as { userId?: string })?.userId ?? session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = checkRateLimit(userId, "wallet_add");
    if (!rateLimit.allowed) {
      const headers = new Headers();
      if (rateLimit.retryAfterMs) {
        headers.set("Retry-After", String(Math.ceil(rateLimit.retryAfterMs / 1000)));
      }
      return NextResponse.json(
        { error: "Rate limit exceeded", retryAfterMs: rateLimit.retryAfterMs },
        { status: 429, headers }
      );
    }
    const body = await req.json().catch(() => ({}));
    const amount = typeof body.amount === "number" ? body.amount : parseInt(body.amount, 10);
    const externalId = typeof body.externalId === "string" ? body.externalId : undefined;
    const reason = typeof body.reason === "string" ? body.reason : undefined;
    if (!Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    const result = await addCoins(userId, amount, { externalId, reason });
    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? "Add failed", newBalance: result.newBalance },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: true, newBalance: result.newBalance });
  } catch (err) {
    console.error("[api/wallet/add]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
