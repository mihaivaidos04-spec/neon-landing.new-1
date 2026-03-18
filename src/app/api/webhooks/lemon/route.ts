import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/src/lib/prisma";
import { addCoins } from "@/src/lib/wallet";
import { getSupabase } from "@/src/lib/supabase";
import { LEMON_PRODUCTS } from "@/src/lib/lemon-products";

const WEBHOOK_SECRET = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

function verifySignature(rawBody: string, signature: string): boolean {
  if (!WEBHOOK_SECRET || !signature) return false;
  const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
  const digest = hmac.update(rawBody, "utf8").digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(digest, "utf8"),
      Buffer.from(signature, "utf8")
    );
  } catch {
    return false;
  }
}

function getCoinsForVariant(variantId: string | number | undefined): number {
  if (variantId == null) return 0;
  const id = String(variantId);
  const product = LEMON_PRODUCTS.find((p) => p.variantId && p.variantId === id);
  return product?.rewards ?? 0;
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-signature") ?? "";
  const rawBody = await req.text();

  if (!verifySignature(rawBody, signature)) {
    console.warn("[webhooks/lemon] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: {
    meta?: { event_name?: string; custom_data?: { user_id?: string } };
    data?: {
      id?: string;
      attributes?: {
        user_email?: string;
        status?: string;
        order_number?: number;
        total?: number;
        first_order_item?: { variant_id?: number; product_id?: number };
      };
    };
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName = payload.meta?.event_name;
  if (eventName !== "order_created") {
    return NextResponse.json({ received: true });
  }

  const attrs = payload.data?.attributes;
  if (!attrs || attrs.status !== "paid") {
    return NextResponse.json({ received: true });
  }

  const orderId = payload.data?.id;
  const userEmail = attrs.user_email;
  const customUserId = payload.meta?.custom_data?.user_id;
  const firstItem = attrs.first_order_item;
  const variantId = firstItem?.variant_id ?? firstItem?.product_id;

  if (!userEmail) {
    console.error("[webhooks/lemon] No user_email in order");
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const supabase = getSupabase();

  // Idempotency: skip if already processed
  const { data: existing } = await supabase
    .from("lemon_payment_log")
    .select("id")
    .eq("lemon_order_id", orderId)
    .single();

  if (existing) {
    return NextResponse.json({ received: true });
  }

  // Resolve user_id: custom_data first, then by email from Prisma
  let userId: string | null = customUserId ?? null;
  if (!userId) {
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true },
    });
    userId = user?.id ?? null;
  }

  const coins = getCoinsForVariant(variantId ?? 0);

  if (userId) {
    // Mark user as having ever purchased (for First Purchase Bonus timer)
    await prisma.user.update({
      where: { id: userId },
      data: { hasEverPurchased: true },
    });
  }

  if (userId && coins > 0) {
    const result = await addCoins(userId, coins, {
      externalId: `lemon-${orderId}`,
      reason: "lemon_payment",
    });
    if (!result.success) {
      console.error("[webhooks/lemon] addCoins failed:", result.error);
    }

    // Ghost Mode: if variant is "ghost", enable it
    const ghostVariantId = process.env.NEXT_PUBLIC_LEMON_VARIANT_GHOST;
    if (ghostVariantId && String(variantId) === ghostVariantId) {
      await supabase
        .from("user_profiles")
        .upsert(
          {
            user_id: userId,
            is_ghost_mode_enabled: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
    }
  }

  // Log for admin
  await supabase.from("lemon_payment_log").insert({
    lemon_order_id: orderId,
    lemon_order_number: attrs.order_number ?? null,
    user_email: userEmail,
    user_id: userId,
    variant_id: variantId != null ? String(variantId) : null,
    product_id: firstItem?.product_id != null ? String(firstItem.product_id) : null,
    amount_cents: attrs.total ?? null,
    coins_added: userId && coins > 0 ? coins : 0,
    status: attrs.status ?? "paid",
    raw_meta: payload.meta ?? null,
  });

  return NextResponse.json({ received: true });
}
