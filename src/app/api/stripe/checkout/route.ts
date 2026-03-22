import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { stripe } from "@/lib/stripe";
import { findBillingPackByAmountAndCoins } from "@/src/lib/billing-packs";
import {
  getStripeCheckoutCancelUrl,
  getStripeCheckoutSuccessUrl,
} from "@/src/lib/stripe-checkout-urls";
import {
  stripeCheckoutAutomaticPaymentMethods,
  stripeCheckoutComplianceParams,
} from "@/src/lib/stripe-checkout-shared";

export const runtime = "nodejs";

/**
 * POST /api/stripe/checkout
 * Body: `{ "amount": number, "coinsAmount": number }` (USD dollars + integer coins)
 *
 * - `unit_amount` for Stripe is **integer cents**: `Math.round(amount * 100)` (e.g. $0.69 → 69)
 * - Currency: `usd`
 * - Metadata: `userId`, `coins` / `coinsAmount` / `coinsToBuy`, `packId`, `amount_cents` (webhook validation)
 * - Product name: e.g. "100 Neon Coins"
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId =
      (session as { userId?: string })?.userId ?? (session?.user as { id?: string })?.id ?? undefined;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const rawAmount = body?.amount;
    const rawCoins = body?.coinsAmount;

    const amount =
      typeof rawAmount === "number" ? rawAmount : parseFloat(String(rawAmount ?? ""));
    const coinsAmount =
      typeof rawCoins === "number" ? rawCoins : parseInt(String(rawCoins ?? ""), 10);

    if (!Number.isFinite(amount) || !Number.isInteger(coinsAmount) || coinsAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid body: expected numeric amount (USD) and positive integer coinsAmount" },
        { status: 400 }
      );
    }

    const pack = findBillingPackByAmountAndCoins(amount, coinsAmount);
    if (!pack) {
      return NextResponse.json(
        { error: "No product matches this amount and coinsAmount" },
        { status: 400 }
      );
    }

    /** Stripe requires integer cents — must match validated pack (e.g. 0.69 → 69, not float) */
    const unitAmountCents = Math.round(amount * 100);
    if (unitAmountCents !== pack.amountCents) {
      return NextResponse.json({ error: "Amount rounding mismatch" }, { status: 400 });
    }

    const userEmail = (session?.user as { email?: string })?.email;

    const productName = `${coinsAmount} Neon Coins`;

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_creation: "always",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: unitAmountCents,
            product_data: {
              name: productName,
              description: `${pack.label} — digital credits for NeonLive (virtual gifts & features).`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: getStripeCheckoutSuccessUrl(),
      cancel_url: getStripeCheckoutCancelUrl(),
      metadata: {
        userId,
        /** Gemini-style alias — webhook also reads `coinsAmount` / `coinsToBuy` */
        coins: String(pack.coins),
        coinsAmount: String(coinsAmount),
        coinAmount: String(pack.coins),
        coinsToBuy: String(pack.coins),
        checkout_kind: "billing_pack",
        packId: pack.id,
        amount_cents: String(unitAmountCents),
      },
      client_reference_id: userId,
      ...(userEmail ? { customer_email: userEmail } : {}),
      ...stripeCheckoutAutomaticPaymentMethods(),
      ...stripeCheckoutComplianceParams(),
    });

    if (!checkoutSession.url) {
      return NextResponse.json({ error: "No checkout URL" }, { status: 500 });
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("[api/stripe/checkout]", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
