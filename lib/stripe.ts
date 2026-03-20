import Stripe from "stripe";

/**
 * API version pinned to match the installed `stripe` package typings.
 * @see node_modules/stripe/types/apiVersion.d.ts
 */
export const STRIPE_API_VERSION = "2026-02-25.clover" as const;

let stripeSingleton: Stripe | null = null;

function getOrCreateStripe(): Stripe {
  if (!stripeSingleton) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    stripeSingleton = new Stripe(key, {
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
 * First property access initializes the client and requires `STRIPE_SECRET_KEY` at runtime.
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
