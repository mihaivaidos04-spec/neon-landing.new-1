import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
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
    const [genderPass, locationPass, vipRow] = await Promise.all([
      hasActivePass(userId, "gender"),
      hasActivePass(userId, "location"),
      prisma.user.findUnique({ where: { id: userId }, select: { isVip: true } }),
    ]);
    const isVip = genderPass && locationPass;
    const isNeonVip = vipRow?.isVip === true;
    return NextResponse.json({ battery: regenBattery, isVip, isNeonVip });
  } catch (err) {
    console.error("[api/battery GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
