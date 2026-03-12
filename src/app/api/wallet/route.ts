import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { getWalletBalance } from "@/src/lib/wallet";

export async function GET() {
  try {
    const session = await auth();
    const userId = (session as any)?.userId ?? session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const balance = await getWalletBalance(userId);
    return NextResponse.json({
      balance: balance ?? 0,
      hasWallet: balance !== null,
    });
  } catch (err) {
    console.error("[api/wallet GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
