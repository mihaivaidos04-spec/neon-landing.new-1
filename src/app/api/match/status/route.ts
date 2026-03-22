import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { getMatchStatus } from "@/src/lib/matching";
import { getPartnerNickname } from "@/src/lib/partner-nickname";

export async function GET() {
  try {
    const session = await auth();
    const userId = (session as any)?.userId ?? session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await getMatchStatus(userId);
    let partnerNickname: string | null | undefined;
    if (result.status === "matched" && result.partnerId) {
      partnerNickname = await getPartnerNickname(result.partnerId);
    }
    return NextResponse.json({
      status: result.status,
      partnerId: result.status === "matched" ? result.partnerId : undefined,
      partnerNickname: result.status === "matched" ? partnerNickname ?? null : undefined,
    });
  } catch (err) {
    console.error("[api/match/status]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
