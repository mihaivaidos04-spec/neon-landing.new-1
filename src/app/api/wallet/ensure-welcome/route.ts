import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { addCoins } from "@/src/lib/wallet";

const WELCOME_COINS = 10;

/**
 * Ensures the user has received welcome coins on first registration.
 * Idempotent: only credits once per user (external_id: welcome-${userId}).
 * Returns { credited: true } if we just added, { credited: false } if already had.
 */
export async function GET() {
  try {
    const session = await auth();
    const userId = (session as any)?.userId ?? session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await addCoins(userId, WELCOME_COINS, {
      externalId: `welcome-${userId}`,
      reason: "welcome",
    });

    if (!result.success) {
      return NextResponse.json({ credited: false, error: result.error }, { status: 200 });
    }

    // If error is "Already credited", we didn't just add
    const justCredited = result.error !== "Already credited";
    return NextResponse.json({
      credited: justCredited,
      newBalance: result.newBalance,
    });
  } catch (err) {
    console.error("[api/wallet/ensure-welcome]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
