import type Stripe from "stripe";

/** Checkout passes these through to the underlying PaymentIntent (Stripe API). */
type CheckoutPaymentIntentData = Stripe.Checkout.SessionCreateParams.PaymentIntentData & {
  automatic_payment_methods?: { enabled: boolean };
};

/**
 * Let Stripe choose available payment methods (cards, wallets, etc.) from your Dashboard settings.
 * @see https://docs.stripe.com/payments/checkout/payment-methods
 */
export function stripeCheckoutAutomaticPaymentMethods(): {
  payment_intent_data: CheckoutPaymentIntentData;
} {
  return {
    payment_intent_data: {
      automatic_payment_methods: { enabled: true },
    },
  };
}

/**
 * Stripe Tax + address collection for Checkout (global VAT/sales tax).
 * Enable **Stripe Tax** in the Dashboard (Settings → Tax); otherwise session creation may fail.
 * Set `STRIPE_AUTOMATIC_TAX=false` to skip (e.g. local dev without Tax configured).
 */
export function stripeCheckoutComplianceParams(): Pick<
  Stripe.Checkout.SessionCreateParams,
  "automatic_tax" | "billing_address_collection"
> {
  if (process.env.STRIPE_AUTOMATIC_TAX === "false") {
    return {};
  }
  return {
    automatic_tax: { enabled: true },
    billing_address_collection: "required",
  };
}
