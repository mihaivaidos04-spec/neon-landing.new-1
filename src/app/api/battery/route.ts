import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { getBatteryLevel, regenerateBatteryIfDue } from "@/src/lib/battery";
import { hasActivePass } from "@/src/lib/user-profiles";

export async function GET() {
  try {
    const session = await auth();
    const userId = (session as any)?.userId ?? session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { battery: regenBattery } = await regenerateBatteryIfDue(userId);
    const [genderPass, locationPass] = await Promise.all([
      hasActivePass(userId, "gender"),
      hasActivePass(userId, "location"),
    ]);
    const isVip = genderPass && locationPass;
    return NextResponse.json({ battery: regenBattery, isVip });
  } catch (err) {
    console.error("[api/battery GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
