/**
 * Add pending rewards for a user. Called by Lemon Squeezy webhook or for testing.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { getSupabase } from "@/src/lib/supabase";
import type { RewardType } from "@/src/lib/rewards";

const VALID_TYPES: RewardType[] = [
  "chat_time_30min",
  "golden_avatar_border",
  "extended_battery",
  "priority_matching",
];

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = (session as any)?.userId ?? session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const rewardType = (body.rewardType ?? body.reward_type) as RewardType;
    const count = Math.min(10, Math.max(1, parseInt(body.count ?? "1", 10) || 1));

    if (!rewardType || !VALID_TYPES.includes(rewardType)) {
      return NextResponse.json(
        { error: "Invalid rewardType. Use: chat_time_30min, golden_avatar_border, extended_battery, priority_matching" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const rows = Array.from({ length: count }, () => ({
      user_id: userId,
      reward_type: rewardType,
      status: "pending",
    }));

    const { error } = await supabase.from("user_rewards").insert(rows);

    if (error) {
      console.error("[api/rewards/add]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, added: count });
  } catch (err) {
    console.error("[api/rewards/add]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
