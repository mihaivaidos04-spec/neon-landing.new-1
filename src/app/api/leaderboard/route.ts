import { NextResponse } from "next/server";
import { getSupabaseOrNull } from "@/src/lib/supabase";

export async function GET() {
  try {
    const supabase = getSupabaseOrNull();
    if (!supabase) {
      return NextResponse.json({ leaderboard: [] });
    }
    const { data, error } = await supabase.rpc("get_leaderboard_60min", {
      p_limit: 3,
    });

    if (error) {
      console.error("[api/leaderboard]", error);
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }

    const leaderboard = (data ?? []).map((row: { user_id: string; total_spent: number; rank_position: number; is_ghost_mode_enabled?: boolean; user_country_code?: string | null }) => ({
      userId: row.user_id,
      recentCoinsSpent: Number(row.total_spent ?? 0),
      rank: row.rank_position,
      isGhostModeEnabled: !!row.is_ghost_mode_enabled,
      countryCode: row.user_country_code ?? null,
    }));

    return NextResponse.json({ leaderboard });
  } catch (err) {
    console.error("[api/leaderboard]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
