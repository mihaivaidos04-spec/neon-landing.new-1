/**
 * Stripe environment variable names (server-only).
 * Values are read via `lib/stripe.ts` (`STRIPE_SECRET_KEY`) and
 * `src/lib/stripe-webhook-http.ts` (`STRIPE_WEBHOOK_SECRET`).
 *
 * Production (neonchat.live): set these in Railway / `.env`, never commit secrets.
 */
export const STRIPE_SERVER_ENV = {
  /** `sk_live_...` / `sk_test_...` — API client in `lib/stripe.ts` */
  secretKey: "STRIPE_SECRET_KEY",
  secretKeyAlias: "STRIPE_API_KEY",
  /** `whsec_...` — `constructEvent()` in webhook route */
  webhookSecret: "STRIPE_WEBHOOK_SECRET",
} as const;
