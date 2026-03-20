import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { getSupabase } from "@/src/lib/supabase";
import { resolveCountryFromRequestHeaders } from "@/src/lib/geo-from-request";
import { setCountryCodeCookieOnResponse } from "@/src/lib/country-cookie";
import { isPlausibleCountryCode } from "@/src/lib/valid-country-code";

/**
 * Sets User.country from the incoming request (edge geo headers or IP lookup)
 * only when the user has no country yet — preserves manual selection from CountrySelector.
 */
export async function POST() {
  try {
    const session = await auth();
    const userId =
      (session as { userId?: string })?.userId ??
      (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const h = await headers();
    const code = await resolveCountryFromRequestHeaders(h);
    if (!code || !isPlausibleCountryCode(code)) {
      const res = NextResponse.json({ countryCode: null, updated: false });
      return res;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { country: true },
    });
    if (user?.country) {
      const res = NextResponse.json({
        countryCode: user.country,
        updated: false,
      });
      if (isPlausibleCountryCode(user.country)) {
        setCountryCodeCookieOnResponse(res, user.country);
      }
      return res;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { country: code },
    });

    try {
      const supabase = getSupabase();
      await supabase.from("user_profiles").upsert(
        {
          user_id: userId,
          user_country_code: code,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    } catch (e) {
      console.error("[api/me/sync-country] supabase", e);
    }

    const res = NextResponse.json({ countryCode: code, updated: true });
    setCountryCodeCookieOnResponse(res, code);
    return res;
  } catch (err) {
    console.error("[api/me/sync-country]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
