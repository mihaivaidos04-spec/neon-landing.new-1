import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { getSupabase } from "@/src/lib/supabase";
import { getWalletBalance } from "@/src/lib/wallet";
import { GHOST_MODE_COST_PER_2MIN } from "@/src/lib/coins";

/** Check if user has Ghost product (unlimited) from Lemon purchase */
async function hasGhostSubscription(userId: string): Promise<boolean> {
  const ghostVariantId = process.env.NEXT_PUBLIC_LEMON_VARIANT_GHOST;
  if (!ghostVariantId) return false;
  const supabase = getSupabase();
  const { data } = await supabase
    .from("lemon_payment_log")
    .select("id")
    .eq("user_id", userId)
    .eq("variant_id", ghostVariantId)
    .limit(1)
    .maybeSingle();
  return !!data;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = (session as any)?.userId ?? session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const enabled = body?.enabled === true;

    const supabase = getSupabase();

    if (enabled) {
      const hasSubscription = await hasGhostSubscription(userId);
      if (!hasSubscription) {
        const balance = await getWalletBalance(userId);
        const hasCoins = (balance ?? 0) >= GHOST_MODE_COST_PER_2MIN;
        if (!hasCoins) {
          return NextResponse.json(
            { needsPayment: true, error: "Insufficient coins or subscription" },
            { status: 402 }
          );
        }
      }

      const { error } = await supabase
        .from("user_profiles")
        .upsert(
          { user_id: userId, is_ghost_mode_enabled: true, updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        );

      if (error) {
        console.error("[api/ghost/toggle]", error);
        return NextResponse.json({ error: "Failed to enable" }, { status: 500 });
      }
    } else {
      const { error } = await supabase
        .from("user_profiles")
        .update({ is_ghost_mode_enabled: false, updated_at: new Date().toISOString() })
        .eq("user_id", userId);

      if (error) {
        console.error("[api/ghost/toggle]", error);
        return NextResponse.json({ error: "Failed to disable" }, { status: 500 });
      }
    }

    return NextResponse.json({ enabled });
  } catch (err) {
    console.error("[api/ghost/toggle]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
