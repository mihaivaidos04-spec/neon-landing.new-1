import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { chargeBattery } from "@/src/lib/battery";
import { spendCoins } from "@/src/lib/wallet";
import {
  BATTERY_QUICK_CHARGE_COST,
  BATTERY_QUICK_CHARGE_AMOUNT,
} from "@/src/lib/coins";

export async function POST() {
  try {
    const session = await auth();
    const userId = (session as any)?.userId ?? session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const spendResult = await spendCoins(
      userId,
      BATTERY_QUICK_CHARGE_COST,
      "battery_quick_charge"
    );
    if (!spendResult.success) {
      return NextResponse.json(
        { error: spendResult.error ?? "Insufficient balance" },
        { status: 400 }
      );
    }

    const { battery } = await chargeBattery(userId, BATTERY_QUICK_CHARGE_AMOUNT);
    return NextResponse.json({ battery });
  } catch (err) {
    console.error("[api/battery/charge]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
