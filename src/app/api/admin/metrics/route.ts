import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { getSupabase } from "@/src/lib/supabase";

const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

function requireAdmin(userId: string | undefined): boolean {
  if (!ADMIN_USER_ID || !userId) return false;
  return userId === ADMIN_USER_ID;
}

export async function GET() {
  try {
    const session = await auth();
    const userId = (session as any)?.userId ?? session?.user?.id;
    if (!requireAdmin(userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = getSupabase();

    const [walletsRes, profilesRes, referralsRes, utmRes, revenueRes, paymentLogRes] = await Promise.all([
      supabase.from("wallets").select("user_id", { count: "exact", head: true }),
      supabase.from("user_profiles").select("user_id", { count: "exact", head: true }),
      supabase.from("user_profiles").select("user_id", { count: "exact", head: true }).not("referred_by_id", "is", null),
      supabase.from("user_profiles").select("signup_source").not("signup_source", "is", null),
      supabase.from("stripe_payment_log").select("amount_cents, livemode, status").eq("livemode", false).eq("status", "succeeded"),
      supabase.from("stripe_payment_log").select("*").order("created_at", { ascending: false }).limit(100),
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

    const totalTestRevenueCents = (revenueRes.data ?? []).reduce((sum, r) => sum + ((r.amount_cents as number) ?? 0), 0);
    const totalTestRevenue = totalTestRevenueCents / 100;

    const paymentLog = (paymentLogRes.data ?? []).map((r) => ({
      id: r.id,
      eventType: r.event_type,
      paymentIntentId: r.payment_intent_id,
      amountCents: r.amount_cents,
      currency: r.currency,
      status: r.status,
      livemode: r.livemode,
      errorMessage: r.error_message,
      createdAt: r.created_at,
    }));

    return NextResponse.json({
      totalUsers,
      totalReferrals,
      totalTestRevenue,
      totalTestRevenueCents,
      utmTable,
      paymentLog,
    });
  } catch (err) {
    console.error("[api/admin/metrics]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
