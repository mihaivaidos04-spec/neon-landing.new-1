import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { getWalletBalance, addCoins, spendCoins } from "@/src/lib/wallet";
import { requireAdmin } from "@/src/lib/admin";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!requireAdmin(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const userId = typeof body.userId === "string" ? body.userId : null;
    const delta = typeof body.delta === "number" ? body.delta : parseInt(body.delta, 10);

    if (!userId || !Number.isInteger(delta) || delta === 0) {
      return NextResponse.json({ error: "Invalid userId or delta" }, { status: 400 });
    }

    if (delta > 0) {
      const result = await addCoins(userId, delta, { reason: "admin_adjustment" });
      if (!result.success) {
        return NextResponse.json({ error: result.error ?? "Failed to add coins" }, { status: 400 });
      }
    } else {
      const result = await spendCoins(userId, Math.abs(delta), "admin_adjustment");
      if (!result.success) {
        return NextResponse.json({ error: result.error ?? "Insufficient balance" }, { status: 400 });
      }
    }

    const balance = await getWalletBalance(userId);
    return NextResponse.json({ success: true, newBalance: balance ?? 0 });
  } catch (err) {
    console.error("[api/admin/users/adjust-coins]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
