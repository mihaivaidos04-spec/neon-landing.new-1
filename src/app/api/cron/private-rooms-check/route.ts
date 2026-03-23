import { NextRequest, NextResponse } from "next/server";
import { getSupabaseOrNull } from "@/src/lib/supabase";
import { getWalletBalance, spendCoins } from "@/src/lib/wallet";
import { PRIVATE_ROOM_COST_PER_MIN } from "@/src/lib/coins";

export async function POST(req: NextRequest) {
  // Optional: require CRON_SECRET to prevent public abuse
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseOrNull();
    if (!supabase) {
      return NextResponse.json({ checked: 0, closed: 0, skipped: true });
    }
    const { data: rooms } = await supabase
      .from("private_rooms")
      .select("id, host_user_id")
      .eq("status", "active");

    if (!rooms?.length) {
      return NextResponse.json({ checked: 0, closed: 0 });
    }

    const closedIds = [];
    for (const room of rooms) {
      const balance = await getWalletBalance(room.host_user_id);
      const canAfford = (balance ?? 0) >= PRIVATE_ROOM_COST_PER_MIN;

      if (!canAfford) {
        await supabase
          .from("private_rooms")
          .update({ status: "closed", closed_at: new Date().toISOString() })
          .eq("id", room.id);
        closedIds.push(room.id);
      } else {
        await spendCoins(
          room.host_user_id,
          PRIVATE_ROOM_COST_PER_MIN,
          "private_room"
        );
      }
    }

    return NextResponse.json({
      checked: rooms.length,
      closed: closedIds.length,
      closedIds,
    });
  } catch (err) {
    console.error("[cron/private-rooms-check]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
