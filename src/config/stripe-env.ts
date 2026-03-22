/**
 * Stripe environment variable names (server-only).
 * Values are read via `lib/stripe.ts` (`STRIPE_SECRET_KEY`) and
 * `app/api/webhook/stripe/route.ts` (`STRIPE_WEBHOOK_SECRET`).
 *
 * Production (neonchat.live): set these in Railway / `.env`, never commit secrets.
 *
 * Browser / Stripe.js: use `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` or `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
 * (both supported in `lib/stripe.ts` → `getStripePublishableKey()`).
 *
 * Checkout redirects (defaults: success `/profile?payment=success`, cancel `/billing?canceled=1`):
 * - `STRIPE_CHECKOUT_SUCCESS_URL` — full URL; append `session_id={CHECKOUT_SESSION_ID}` if missing
 * - `STRIPE_CHECKOUT_SUCCESS_PATH` — path only, e.g. `/profile?payment=success`
 * - `STRIPE_CHECKOUT_CANCEL_URL` / `STRIPE_CHECKOUT_CANCEL_PATH` — e.g. `/billing?canceled=1` or `/shop`
 */
export const STRIPE_SERVER_ENV = {
  /** `sk_live_...` / `sk_test_...` — API client in `lib/stripe.ts` */
  secretKey: "STRIPE_SECRET_KEY",
  secretKeyAlias: "STRIPE_API_KEY",
  /** `whsec_...` — `constructEvent()` in webhook route */
  webhookSecret: "STRIPE_WEBHOOK_SECRET",
} as const;
