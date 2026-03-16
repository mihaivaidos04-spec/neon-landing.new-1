import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { addCoins } from "@/src/lib/wallet";

const LEMON_WEBHOOK_SECRET = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

/** Map Lemon Squeezy variant_id to coin amount */
function getCoinsForVariant(variantId: string): number {
  const v = String(variantId);
  const starter = process.env.NEXT_PUBLIC_LEMON_VARIANT_STARTER ?? "";
  const neon = process.env.NEXT_PUBLIC_LEMON_VARIANT_NEON ?? "";
  const hyper = process.env.NEXT_PUBLIC_LEMON_VARIANT_HYPER ?? "";
  if (v === starter) return 10;
  if (v === neon) return 50;
  if (v === hyper) return 100;
  return 50;
}

export async function POST(req: NextRequest) {
  try {
    if (!LEMON_WEBHOOK_SECRET) {
      console.error("[webhook] LEMON_SQUEEZY_WEBHOOK_SECRET not set");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    const rawBody = await req.text();
    const signature = req.headers.get("X-Signature") ?? "";

    const hmac = crypto.createHmac("sha256", LEMON_WEBHOOK_SECRET);
    const digest = Buffer.from(hmac.update(rawBody).digest("hex"), "utf8");
    const sigBuffer = Buffer.from(signature, "utf8");

    if (signature.length === 0 || !crypto.timingSafeEqual(digest, sigBuffer)) {
      console.warn("[webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload?.meta?.event_name;
    const customData = payload?.meta?.custom_data ?? {};
    const data = payload?.data;
    const attrs = data?.attributes ?? {};
    const firstItem = attrs.first_order_item ?? {};

    if (eventName === "order_created") {
      const userId = customData.user_id;
      if (!userId) {
        console.warn("[webhook] order_created: no user_id in custom_data (pasează userId în checkout)");
        return NextResponse.json({ received: true });
      }

      const variantId = String(firstItem.variant_id ?? attrs.variant_id ?? "");
      const orderId = String(data?.id ?? attrs.identifier ?? "");
      const coins = getCoinsForVariant(variantId);

      const result = await addCoins(String(userId), coins, {
        externalId: `lemon-order-${orderId}`,
        reason: "lemon_purchase",
      });
      if (!result.success) {
        console.error("[webhook] addCoins failed:", result.error);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhook]", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
