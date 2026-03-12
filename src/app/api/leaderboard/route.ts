import { NextResponse } from "next/server";
import { getSupabase } from "@/src/lib/supabase";

export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.rpc("get_leaderboard_60min", {
      p_limit: 3,
    });

    if (error) {
      console.error("[api/leaderboard]", error);
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }

    const leaderboard = (data ?? []).map((row: { user_id: string; total_spent: number; rank_position: number }) => ({
      userId: row.user_id,
      totalSpent: Number(row.total_spent ?? 0),
      rank: row.rank_position,
    }));

    return NextResponse.json({ leaderboard });
  } catch (err) {
    console.error("[api/leaderboard]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
