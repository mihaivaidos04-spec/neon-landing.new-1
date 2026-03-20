import Stripe from "stripe";

/**
 * API version pinned to match the installed `stripe` package typings.
 * @see node_modules/stripe/types/apiVersion.d.ts
 */
export const STRIPE_API_VERSION = "2026-02-25.clover" as const;

/** Server secret: `sk_live_...` / `sk_test_...` — prefer STRIPE_SECRET_KEY; STRIPE_API_KEY is a common alias. */
export function getStripeSecretKey(): string {
  const key =
    process.env.STRIPE_SECRET_KEY?.trim() ||
    process.env.STRIPE_API_KEY?.trim();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY (or STRIPE_API_KEY) is not configured");
  }
  return key;
}

/**
 * Publishable key (`pk_...`) for client-side Stripe.js / Elements.
 * Expose to the browser via `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` (recommended); `STRIPE_PUBLIC_KEY` is read on the server only (e.g. API route).
 */
export function getStripePublishableKey(): string | undefined {
  const k =
    process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY?.trim() ||
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ||
    process.env.STRIPE_PUBLIC_KEY?.trim();
  return k || undefined;
}

let stripeSingleton: Stripe | null = null;

function getOrCreateStripe(): Stripe {
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(getStripeSecretKey(), {
      apiVersion: STRIPE_API_VERSION,
      typescript: true,
    });
  }
  return stripeSingleton;
}

/**
 * Lazy singleton — safe for Next.js (no throw at import when key is missing during build).
 * Prefer this in API routes: `getStripe().checkout.sessions.create(...)`
 */
export function getStripe(): Stripe {
  return getOrCreateStripe();
}

/**
 * Same client as `getStripe()`, as a `const` for drop-in usage: `stripe.checkout.sessions.create(...)`
 * First property access initializes the client and requires `STRIPE_SECRET_KEY` (or `STRIPE_API_KEY`) at runtime.
 */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    const client = getOrCreateStripe();
    const value = Reflect.get(client as object, prop, receiver);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
