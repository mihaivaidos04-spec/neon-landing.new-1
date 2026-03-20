import type { NextRequest, NextResponse } from "next/server";

/**
 * Legacy `/api/webhooks/stripe` — delegates to `app/api/webhook/stripe/route.ts`
 * via dynamic import to avoid circular module graphs.
 */
export async function stripeWebhookPOST(req: NextRequest): Promise<NextResponse> {
  const { POST } = await import("@/app/api/webhook/stripe/route");
  return POST(req);
}
