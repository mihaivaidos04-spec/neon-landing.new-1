import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { getSupabase } from "@/src/lib/supabase";

export async function GET() {
  try {
    const session = await auth();
    const userId = (session as any)?.userId ?? session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabase();
    const { data } = await supabase
      .from("user_profiles")
      .select("is_ghost_mode_enabled")
      .eq("user_id", userId)
      .single();

    return NextResponse.json({
      isGhostModeEnabled: !!data?.is_ghost_mode_enabled,
    });
  } catch (err) {
    console.error("[api/ghost/status]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
