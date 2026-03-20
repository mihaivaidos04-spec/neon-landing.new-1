import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { getSupabase } from "@/src/lib/supabase";
import { prisma } from "@/src/lib/prisma";
import { isPlausibleCountryCode } from "@/src/lib/valid-country-code";
import { setCountryCodeCookieOnResponse } from "@/src/lib/country-cookie";

export async function GET() {
  try {
    const session = await auth();
    const userId = (session as any)?.userId ?? session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { country: true },
    });
    return NextResponse.json({ countryCode: user?.country ?? null });
  } catch (err) {
    console.error("[api/me/region GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = (session as any)?.userId ?? session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const countryCode = (body?.countryCode as string)?.toUpperCase()?.slice(0, 2) || null;

    if (countryCode && !isPlausibleCountryCode(countryCode)) {
      return NextResponse.json({ error: "Invalid country code" }, { status: 400 });
    }

    const supabase = getSupabase();
    const { error: supabaseError } = await supabase.from("user_profiles").upsert(
      { user_id: userId, user_country_code: countryCode || null, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );

    if (supabaseError) {
      console.error("[api/me/region POST]", supabaseError);
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }

    // Update Prisma User.country
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { country: countryCode || null },
      });
    } catch (e) {
      console.error("[api/me/region POST] prisma", e);
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }

    const res = NextResponse.json({ countryCode: countryCode || null });
    if (countryCode && isPlausibleCountryCode(countryCode)) {
      setCountryCodeCookieOnResponse(res, countryCode);
    }
    return res;
  } catch (err) {
    console.error("[api/me/region POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
