import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

/**
 * Validate a creator promocode. Returns promocodeId and bonusPercent if valid.
 * Used at checkout before creating a Stripe Checkout session.
 */
export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code")?.toUpperCase().trim();
    if (!code || code.length < 4) {
      return NextResponse.json({ valid: false, error: "Invalid code" }, { status: 400 });
    }

    const promocode = await prisma.promocode.findUnique({
      where: { code },
    });

    if (!promocode) {
      return NextResponse.json({ valid: false, error: "Code not found" }, { status: 404 });
    }

    return NextResponse.json({
      valid: true,
      promocodeId: promocode.id,
      bonusPercent: promocode.bonusPercent,
    });
  } catch (err) {
    console.error("[api/promocode/validate]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
