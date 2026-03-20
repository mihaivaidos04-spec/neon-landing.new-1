export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Legacy path: `/api/webhooks/stripe` — same as `/api/webhook/stripe` */
export { stripeWebhookPOST as POST } from "@/src/lib/stripe-webhook-http";
