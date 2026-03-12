import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { getSupabase } from "@/src/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userId = (session as any)?.userId ?? session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roomId = req.nextUrl.searchParams.get("roomId");
    if (!roomId) {
      return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("private_rooms")
      .select("id, host_user_id, guest_user_id, status")
      .eq("id", roomId)
      .single();

    if (error || !data) {
      return NextResponse.json({ room: null });
    }

    if (data.host_user_id !== userId && data.guest_user_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ room: data });
  } catch (err) {
    console.error("[api/private/room]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
