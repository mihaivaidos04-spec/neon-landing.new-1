import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { decreaseBattery } from "@/src/lib/battery";

/** Aliniat cu client: 3% / min apel (~25% în ~8–9 min) */
const HEARTBEAT_DRAIN = 3;

/**
 * Video session heartbeat – call every 60 seconds during active call.
 * Decrements battery by HEARTBEAT_DRAIN units. Returns depleted: true when battery hits 0.
 */
export async function POST() {
  try {
    const session = await auth();
    const userId = (session as any)?.userId ?? session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { battery } = await decreaseBattery(userId, HEARTBEAT_DRAIN);
    const depleted = battery <= 0;

    return NextResponse.json({ battery, depleted });
  } catch (err) {
    console.error("[api/battery/heartbeat]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
