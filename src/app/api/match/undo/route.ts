import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { matchWithPartner } from "@/src/lib/matching";
import { spendCoins } from "@/src/lib/wallet";
import { UNDO_NEXT_COST } from "@/src/lib/coins";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = (session as any)?.userId ?? session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const partnerId = body?.partnerId;
    if (!partnerId || typeof partnerId !== "string") {
      return NextResponse.json({ error: "Missing partnerId" }, { status: 400 });
    }

    const spendResult = await spendCoins(userId, UNDO_NEXT_COST, "undo_next");
    if (!spendResult.success) {
      return NextResponse.json(
        { error: spendResult.error ?? "Insufficient balance" },
        { status: 400 }
      );
    }

    const result = await matchWithPartner(userId, partnerId);

    return NextResponse.json({
      status: result.status,
      partnerId: result.status === "matched" ? result.partnerId : undefined,
    });
  } catch (err) {
    console.error("[api/match/undo]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
