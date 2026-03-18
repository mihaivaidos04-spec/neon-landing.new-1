import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { getSupabase } from "@/src/lib/supabase";

const ADMIN_USER_ID = process.env.ADMIN_USER_ID;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

function requireAdmin(session: { user?: { id?: string; email?: string } } | null): boolean {
  if (!session?.user) return false;
  const email = session.user.email;
  const userId = (session as any)?.userId ?? session.user.id;
  if (ADMIN_EMAIL && email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) return true;
  if (ADMIN_USER_ID && userId && userId === ADMIN_USER_ID) return true;
  return false;
}

export async function GET() {
  try {
    const session = await auth();
    if (!requireAdmin(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = getSupabase();

    const [
      walletsRes,
      profilesRes,
      referralsRes,
      utmRes,
      revenueRes,
      paymentLogRes,
      coinsSoldRes,
      lemonLogRes,
    ] = await Promise.all([
      supabase.from("wallets").select("user_id", { count: "exact", head: true }),
      supabase.from("user_profiles").select("user_id", { count: "exact", head: true }),
      supabase.from("user_profiles").select("user_id", { count: "exact", head: true }).not("referred_by_id", "is", null),
      supabase.from("user_profiles").select("signup_source").not("signup_source", "is", null),
      supabase.from("stripe_payment_log").select("amount_cents, livemode, status").eq("livemode", false).eq("status", "succeeded"),
      supabase.from("stripe_payment_log").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("wallet_transactions").select("amount").eq("type", "add").eq("reason", "lemon_payment"),
      supabase.from("lemon_payment_log").select("id,user_email,coins_added,amount_cents,status,created_at").order("created_at", { ascending: false }).limit(10),
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

    const totalCoinsSold = (coinsSoldRes.error ? 0 : (coinsSoldRes.data ?? [])).reduce((sum, r) => sum + ((r.amount as number) ?? 0), 0);

    const lemonTransactions = (lemonLogRes.error ? [] : (lemonLogRes.data ?? [])).map((r: { id: string; user_email: string; coins_added: number; amount_cents: number | null; status: string; created_at: string }) => ({
      id: r.id,
      userEmail: r.user_email,
      coinsAdded: r.coins_added ?? 0,
      amountCents: r.amount_cents,
      status: r.status,
      createdAt: r.created_at,
    }));

    return NextResponse.json({
      totalUsers,
      totalReferrals,
      totalTestRevenue,
      totalTestRevenueCents,
      totalCoinsSold,
      utmTable,
      paymentLog,
      lemonTransactions,
    });
  } catch (err) {
    console.error("[api/admin/metrics]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
