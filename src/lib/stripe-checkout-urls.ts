import { getPublicSiteOrigin } from "@/src/lib/public-site-url";

/**
 * Stripe Checkout `success_url` / `cancel_url` for neonchat.live.
 *
 * - Defaults: success → `/profile?payment=success`, cancel → `/billing?canceled=1` (pagina de „shop”/top-up).
 * - Override with full URLs (`STRIPE_CHECKOUT_SUCCESS_URL`) or paths (`STRIPE_CHECKOUT_SUCCESS_PATH`).
 */
export function getStripeCheckoutSuccessUrl(): string {
  const explicit = process.env.STRIPE_CHECKOUT_SUCCESS_URL?.trim();
  if (explicit) {
    return explicit.includes("{CHECKOUT_SESSION_ID}")
      ? explicit
      : `${explicit}${explicit.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`;
  }
  const path = process.env.STRIPE_CHECKOUT_SUCCESS_PATH?.trim() ?? "/profile?payment=success";
  const origin = getPublicSiteOrigin();
  const p = path.startsWith("/") ? path : `/${path}`;
  const join = p.includes("?") ? "&" : "?";
  return `${origin}${p}${join}session_id={CHECKOUT_SESSION_ID}`;
}

export function getStripeCheckoutCancelUrl(): string {
  const explicit = process.env.STRIPE_CHECKOUT_CANCEL_URL?.trim();
  if (explicit) return explicit;
  const path = process.env.STRIPE_CHECKOUT_CANCEL_PATH?.trim() ?? "/billing?canceled=1";
  const origin = getPublicSiteOrigin();
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${p}`;
}
