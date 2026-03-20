import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { handleCheckoutSessionCompleted } from "@/src/lib/stripe-webhook-handler";

/**
 * Shared Stripe webhook HTTP layer: raw body + signature verification.
 * Used by `/api/webhook/stripe` and legacy `/api/webhooks/stripe`.
 */
export async function stripeWebhookPOST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    console.warn("[stripe webhook] Invalid signature", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    try {
      await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
    } catch (err) {
      console.error("[stripe webhook] checkout.session.completed handler failed", err);
      return NextResponse.json({ received: true, ok: false }, { status: 200 });
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
