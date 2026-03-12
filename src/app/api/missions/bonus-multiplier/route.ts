import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { spendCoins, addCoins } from "@/src/lib/wallet";

const BONUS_COST = 1;
const BONUS_REWARD = 3;

/**
 * Heads or tails: spend 1 coin, 50% chance to win 3 coins.
 * Server-side random to prevent cheating.
 */
export async function POST() {
  try {
    const session = await auth();
    const userId = (session as any)?.userId ?? session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const spendResult = await spendCoins(userId, BONUS_COST, "bonus_multiplier_game");
    if (!spendResult.success) {
      return NextResponse.json(
        { error: spendResult.error ?? "Insufficient balance", won: false },
        { status: 400 }
      );
    }

    const won = Math.random() < 0.5;
    if (won) {
      const addResult = await addCoins(userId, BONUS_REWARD, {
        externalId: `bonus-mult-${userId}-${Date.now()}`,
        reason: "bonus_multiplier_win",
      });
      if (!addResult.success) {
        return NextResponse.json({ error: "Add failed", won: false }, { status: 500 });
      }
    }

    return NextResponse.json({
      won,
      bonusCoins: won ? BONUS_REWARD : 0,
      newBalance: won ? undefined : spendResult.newBalance,
    });
  } catch (err) {
    console.error("[api/missions/bonus-multiplier]", err);
    return NextResponse.json({ error: "Server error", won: false }, { status: 500 });
  }
}
