import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { getSupabase } from "@/src/lib/supabase";
import { requireAdmin } from "@/src/lib/admin";

export async function GET() {
  try {
    const session = await auth();
    if (!requireAdmin(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = getSupabase();

    const [walletsRes, profilesRes, referralsRes, utmRes] = await Promise.all([
      supabase.from("wallets").select("user_id", { count: "exact", head: true }),
      supabase.from("user_profiles").select("user_id", { count: "exact", head: true }),
      supabase.from("user_profiles").select("user_id", { count: "exact", head: true }).not("referred_by_id", "is", null),
      supabase.from("user_profiles").select("signup_source").not("signup_source", "is", null),
    ]);

    const totalUsers = Math.max(walletsRes.count ?? 0, profilesRes.count ?? 0);
    const totalReferrals = referralsRes.count ?? 0;

    const utmCounts: Record<string, number> = {};
    for (const row of utmRes.data ?? []) {
      const src = (row.signup_source as string) || "unknown";
      utmCounts[src] = (utmCounts[src] ?? 0) + 1;
    }
    const utmTable = Object.entries(utmCounts)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      totalUsers,
      totalReferrals,
      utmTable,
    });
  } catch (err) {
    console.error("[api/admin/metrics]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
