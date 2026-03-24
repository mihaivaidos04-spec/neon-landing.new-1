import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { getSupabase } from "@/src/lib/supabase";

/** Ghost mode — free for all authenticated users (no payment or coin gate). */
export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = (session as { userId?: string })?.userId ?? session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const enabled = body?.enabled === true;

    const supabase = getSupabase();

    if (enabled) {
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
