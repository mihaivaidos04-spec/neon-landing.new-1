import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { getSupabase } from "@/src/lib/supabase";
import { spendCoins } from "@/src/lib/wallet";
import { PRIORITY_BOOST_COST } from "@/src/lib/coins";
import { reRunMatchingForUser } from "@/src/lib/matching";
import { getPartnerNickname } from "@/src/lib/partner-nickname";

export async function POST() {
  try {
    const session = await auth();
    const userId = (session as any)?.userId ?? session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabase();
    const { data: existing } = await supabase
      .from("active_users")
      .select("user_id")
      .eq("user_id", userId)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Join the queue first" },
        { status: 400 }
      );
    }

    const spendResult = await spendCoins(userId, PRIORITY_BOOST_COST, "priority_boost");
    if (!spendResult.success) {
      return NextResponse.json(
        { error: spendResult.error ?? "Insufficient balance" },
        { status: 400 }
      );
    }

    const { error: updateErr } = await supabase
      .from("active_users")
      .update({
        boosted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateErr) {
      console.error("[api/match/boost]", updateErr);
      return NextResponse.json({ error: "Failed to boost" }, { status: 500 });
    }

    const matchResult = await reRunMatchingForUser(userId);

    let partnerNickname: string | null | undefined;
    if (matchResult.status === "matched" && matchResult.partnerId) {
      partnerNickname = await getPartnerNickname(matchResult.partnerId);
    }

    return NextResponse.json({
      success: true,
      newBalance: spendResult.newBalance,
      status: matchResult.status,
      partnerId: matchResult.status === "matched" ? matchResult.partnerId : undefined,
      partnerNickname: matchResult.status === "matched" ? partnerNickname ?? null : undefined,
    });
  } catch (err) {
    console.error("[api/match/boost]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
