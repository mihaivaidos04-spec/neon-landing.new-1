import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { getSupabase } from "@/src/lib/supabase";
import { spendCoins } from "@/src/lib/wallet";
import { PRIVATE_ROOM_COST_PER_MIN } from "@/src/lib/coins";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const hostUserId = (session as any)?.userId ?? session?.user?.id;
    if (!hostUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const guestUserId = body?.guestUserId as string | undefined;
    const roomId = body?.roomId as string | undefined;

    if (!guestUserId || !roomId) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const spendResult = await spendCoins(
      hostUserId,
      PRIVATE_ROOM_COST_PER_MIN,
      "private_room"
    );
    if (!spendResult.success) {
      return NextResponse.json(
        { error: spendResult.error ?? "Insufficient balance" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const { error } = await supabase.from("private_rooms").insert({
      id: roomId,
      host_user_id: hostUserId,
      guest_user_id: guestUserId,
      status: "active",
    });

    if (error) {
      console.error("[api/private/create]", error);
      return NextResponse.json(
        { error: "Failed to create room" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      roomId,
      newBalance: spendResult.newBalance,
    });
  } catch (err) {
    console.error("[api/private/create]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
