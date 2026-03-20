import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { handleCheckoutSessionCompleted } from "@/src/lib/stripe-webhook-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST https://www.neonchat.live/api/webhook/stripe
 *
 * 1. Verifies `Stripe-Signature` with `STRIPE_WEBHOOK_SECRET` + raw body.
 * 2. On `checkout.session.completed`, reads `userId` and `coinAmount` (and related keys)
 *    from session metadata; `handleCheckoutSessionCompleted` updates Prisma + wallet.
 * 3. Always returns **200** for valid signed events so Stripe does not retry indefinitely.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
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
    const session = event.data.object as Stripe.Checkout.Session;
    try {
      await handleCheckoutSessionCompleted(session);
    } catch (err) {
      console.error("[stripe webhook] checkout.session.completed handler failed", err);
      return NextResponse.json({ received: true, ok: false }, { status: 200 });
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
