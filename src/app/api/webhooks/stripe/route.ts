export const runtime = "nodejs";

/** Legacy path: `/api/webhooks/stripe` — same as `/api/webhook/stripe` */
export { stripeWebhookPOST as POST } from "@/src/lib/stripe-webhook-http";
