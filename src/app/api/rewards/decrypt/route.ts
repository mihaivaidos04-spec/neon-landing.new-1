import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { decryptReward } from "@/src/lib/rewards";

export async function POST() {
  try {
    const session = await auth();
    const userId = (session as any)?.userId ?? session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const result = await decryptReward(userId);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? "No pending reward" },
        { status: 400 }
      );
    }
    return NextResponse.json({
      success: true,
      rewardType: result.rewardType,
      label: result.label,
    });
  } catch (err) {
    console.error("[api/rewards/decrypt]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
