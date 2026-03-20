export const runtime = "nodejs";

/**
 * POST /api/webhook/stripe
 *
 * Verifies `Stripe-Signature` with `STRIPE_WEBHOOK_SECRET` and raw body,
 * then handles `checkout.session.completed` (metadata: `userId`, `coinsAmount`, etc.).
 */
export { stripeWebhookPOST as POST } from "@/src/lib/stripe-webhook-http";
