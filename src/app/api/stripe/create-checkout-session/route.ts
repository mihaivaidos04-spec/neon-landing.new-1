import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { getStripeService } from "@/src/lib/stripe-service";
import type { StripePlanId } from "@/src/lib/stripe-products";
import { getStripePlanById } from "@/src/lib/stripe-products";

const VALID_PLANS: StripePlanId[] = ["essential", "creator", "studio", "privacy_plus"];

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = (session as { userId?: string })?.userId ?? (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const planId = body?.planId as string | undefined;
    const promocodeId = typeof body?.promocodeId === "string" ? body.promocodeId : undefined;

    if (!planId || !VALID_PLANS.includes(planId as StripePlanId)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (!getStripePlanById(planId)) {
      return NextResponse.json({ error: "Plan not found" }, { status: 400 });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      process.env.AUTH_URL ??
      "http://localhost:3000";
    const origin = baseUrl.replace(/\/$/, "");

    const userEmail = (session?.user as { email?: string })?.email;

    const stripe = getStripeService();
    const { url } = await stripe.createCheckoutSession({
      userId,
      userEmail,
      planId: planId as StripePlanId,
      successUrl: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/checkout?canceled=1`,
      promocodeId,
    });

    if (!url) {
      return NextResponse.json({ error: "Could not create checkout session" }, { status: 500 });
    }

    return NextResponse.json({ url });
  } catch (err) {
    console.error("[api/stripe/create-checkout-session]", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
