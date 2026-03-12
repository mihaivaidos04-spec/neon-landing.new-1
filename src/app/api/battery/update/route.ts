import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { decreaseBattery } from "@/src/lib/battery";

export async function POST() {
  try {
    const session = await auth();
    const userId = (session as any)?.userId ?? session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { battery } = await decreaseBattery(userId, 1);
    return NextResponse.json({ battery });
  } catch (err) {
    console.error("[api/battery/update]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
