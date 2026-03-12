import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { getSupabase } from "@/src/lib/supabase";
import { spendCoins } from "@/src/lib/wallet";
import { getReactionCost } from "@/src/lib/coins";
import type { ReactionId } from "@/src/lib/reactions";

const VALID_REACTIONS: ReactionId[] = ["heart", "fire", "laugh", "love", "wow"];

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = (session as any)?.userId ?? session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const toUserId = body?.toUserId as string | undefined;
    const reactionType = body?.reactionType as ReactionId | undefined;

    if (!toUserId || !reactionType || !VALID_REACTIONS.includes(reactionType)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const cost = getReactionCost(reactionType);
    const spendResult = await spendCoins(userId, cost, "reaction");
    if (!spendResult.success) {
      return NextResponse.json(
        { error: spendResult.error ?? "Insufficient balance" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const { error } = await supabase.from("reactions").insert({
      from_user_id: userId,
      to_user_id: toUserId,
      reaction_type: reactionType,
    });

    if (error) {
      console.error("[api/reactions/send]", error);
      return NextResponse.json({ error: "Failed to send" }, { status: 500 });
    }

    return NextResponse.json({ success: true, newBalance: spendResult.newBalance });
  } catch (err) {
    console.error("[api/reactions/send]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
