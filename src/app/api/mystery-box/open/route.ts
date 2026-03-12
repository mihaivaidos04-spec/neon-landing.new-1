import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { getSupabase } from "@/src/lib/supabase";
import { spendCoins, addCoins } from "@/src/lib/wallet";
import { chargeBattery } from "@/src/lib/battery";
import { MYSTERY_BOX_COST, MYSTERY_BOX_SMALL_REWARD, MYSTERY_BOX_BIG_REWARD } from "@/src/lib/coins";

export type MysteryBoxResult =
  | "coins_small"
  | "coins_big"
  | "battery_bonus"
  | "sticker"
  | "zero_drain"
  | "nothing";

type Prize = {
  type: MysteryBoxResult;
  coins?: number;
  batteryBonus?: number;
  zeroDrainMinutes?: number;
};

function rollMysteryBox(): Prize {
  const r = Math.random();
  // 35% coins_small, 10% coins_big, 25% battery_bonus, 10% sticker, 10% zero_drain, 10% nothing
  if (r < 0.35) return { type: "coins_small", coins: MYSTERY_BOX_SMALL_REWARD };
  if (r < 0.45) return { type: "coins_big", coins: MYSTERY_BOX_BIG_REWARD };
  if (r < 0.7) return { type: "battery_bonus", batteryBonus: 10 };
  if (r < 0.8) return { type: "sticker" };
  if (r < 0.9) return { type: "zero_drain", zeroDrainMinutes: 2 };
  return { type: "nothing" };
}

export async function POST() {
  try {
    const session = await auth();
    const userId = (session as any)?.userId ?? session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const spendResult = await spendCoins(userId, MYSTERY_BOX_COST, "mystery_box");
    if (!spendResult.success) {
      return NextResponse.json(
        { error: spendResult.error ?? "Insufficient balance" },
        { status: 400 }
      );
    }

    const prize = rollMysteryBox();
    const supabase = getSupabase();

    if (prize.coins && prize.coins > 0) {
      await addCoins(userId, prize.coins, {
        reason: `mystery_box_${prize.type}`,
      });
    }

    if (prize.batteryBonus) {
      await chargeBattery(userId, prize.batteryBonus);
    }

    if (prize.type === "sticker") {
      const { data: existing } = await supabase.from("user_profiles").select("user_id").eq("user_id", userId).single();
      if (existing) {
        await supabase.from("user_profiles").update({ rare_sticker_unlocked: true, updated_at: new Date().toISOString() }).eq("user_id", userId);
      } else {
        await supabase.from("user_profiles").insert({ user_id: userId, rare_sticker_unlocked: true });
      }
    }

    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", userId)
      .single();

    const newBalance = (wallet?.balance as number) ?? spendResult.newBalance;

    return NextResponse.json({
      success: true,
      prize: prize.type,
      coinsWon: prize.coins ?? 0,
      batteryBonus: prize.batteryBonus ?? 0,
      zeroDrainMinutes: prize.zeroDrainMinutes ?? 0,
      newBalance,
    });
  } catch (err) {
    console.error("[api/mystery-box/open]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
