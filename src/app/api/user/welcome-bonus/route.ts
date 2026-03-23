import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { addCoins, getWalletBalance } from "@/src/lib/wallet";

export const runtime = "nodejs";

const WELCOME_BONUS_COINS = 50;

function sessionUserId(session: unknown): string | undefined {
  const s = session as { userId?: string; user?: { id?: string } } | null | undefined;
  return s?.userId ?? s?.user?.id;
}

/**
 * POST /api/user/welcome-bonus — idempotent first-time grant after nickname setup.
 * Sets welcomeBonusGranted and credits 50 coins once per user.
 */
export async function POST() {
  try {
    const session = await auth();
    const userId = sessionUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const claimed = await prisma.user.updateMany({
      where: { id: userId, welcomeBonusGranted: false },
      data: { welcomeBonusGranted: true },
    });

    if (claimed.count === 0) {
      const balance = await getWalletBalance(userId);
      return NextResponse.json({
        granted: false,
        balance: balance ?? 0,
      });
    }

    const result = await addCoins(userId, WELCOME_BONUS_COINS, {
      externalId: `welcome-bonus-grant:${userId}`,
      reason: "welcome_bonus",
    });

    if (!result.success) {
      await prisma.user.update({
        where: { id: userId },
        data: { welcomeBonusGranted: false },
      });
      return NextResponse.json(
        { error: result.error ?? "Could not credit coins", balance: result.newBalance },
        { status: 502 }
      );
    }

    return NextResponse.json({
      granted: true,
      balance: result.newBalance,
    });
  } catch (err) {
    console.error("[api/user/welcome-bonus]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
