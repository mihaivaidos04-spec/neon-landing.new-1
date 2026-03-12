import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { getSupabase } from "@/src/lib/supabase";

const REFERRAL_BONUS_AMOUNT = 25;
const COOLDOWN_HOURS = 24;

/**
 * Awards 25% battery when user returns after sharing referral link.
 * 24-hour cooldown per user.
 */
export async function POST() {
  try {
    const session = await auth();
    const userId = (session as any)?.userId ?? session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabase();

    const { data: row } = await supabase
      .from("user_profiles")
      .select("battery_level, referral_bonus_last_claimed_at")
      .eq("user_id", userId)
      .single();

    const lastClaimed = row?.referral_bonus_last_claimed_at as string | null | undefined;
    if (lastClaimed) {
      const elapsed = Date.now() - new Date(lastClaimed).getTime();
      const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;
      if (elapsed < cooldownMs) {
        const remaining = Math.ceil((cooldownMs - elapsed) / 60000);
        return NextResponse.json(
          { awarded: false, error: "cooldown", remainingMinutes: remaining },
          { status: 200 }
        );
      }
    }

    const current = (row?.battery_level as number) ?? 100;
    const next = Math.min(100, current + REFERRAL_BONUS_AMOUNT);

    const { error } = await supabase.from("user_profiles").upsert(
      {
        user_id: userId,
        battery_level: next,
        referral_bonus_last_claimed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) {
      console.error("[api/battery/referral-bonus]", error);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    return NextResponse.json({ awarded: true, battery: next });
  } catch (err) {
    console.error("[api/battery/referral-bonus]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
