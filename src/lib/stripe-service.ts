import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getStripePlanById, type StripePlanId } from "./stripe-products";
import {
  stripeCheckoutAutomaticPaymentMethods,
  stripeCheckoutComplianceParams,
} from "./stripe-checkout-shared";

export type CreateCheckoutParams = {
  userId: string;
  userEmail: string | null | undefined;
  planId: StripePlanId;
  successUrl: string;
  cancelUrl: string;
  promocodeId?: string | null;
};

/**
 * StripeService — checkout sessions for NeonLive platform credits & features.
 */
export class StripeService {
  private readonly stripe: Stripe;

  constructor() {
    this.stripe = getStripe();
  }

  get raw(): Stripe {
    return this.stripe;
  }

  async createCheckoutSession(params: CreateCheckoutParams): Promise<{ url: string | null }> {
    const plan = getStripePlanById(params.planId);
    if (!plan) {
      throw new Error(`Unknown plan: ${params.planId}`);
    }

    const metadata: Record<string, string> = {
      userId: params.userId,
      planId: plan.id,
      credits: String(plan.credits),
      ghost_mode: plan.enableGhostMode ? "true" : "false",
    };
    if (params.promocodeId) {
      metadata.promocode_id = params.promocodeId;
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: "payment",
      customer_creation: "always",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: plan.amountCents,
            product_data: {
              name: `NeonLive — ${plan.name}`,
              description: plan.tagline,
              metadata: { plan_id: plan.id },
            },
          },
          quantity: 1,
        },
      ],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata,
      client_reference_id: params.userId,
      ...(params.userEmail ? { customer_email: params.userEmail } : {}),
      ...stripeCheckoutAutomaticPaymentMethods(),
      ...stripeCheckoutComplianceParams(),
    });

    return { url: session.url };
  }

  constructWebhookEvent(payload: string | Buffer, signature: string): Stripe.Event {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
    }
    return this.stripe.webhooks.constructEvent(payload, signature, secret);
  }
}

let serviceInstance: StripeService | null = null;

export function getStripeService(): StripeService {
  if (!serviceInstance) {
    serviceInstance = new StripeService();
  }
  return serviceInstance;
}
