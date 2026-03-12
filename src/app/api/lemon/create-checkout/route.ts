import { NextRequest, NextResponse } from "next/server";
import {
  createCheckout,
  lemonSqueezySetup,
} from "@lemonsqueezy/lemonsqueezy.js";

const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
const storeId = process.env.LEMON_SQUEEZY_STORE_ID;

export async function POST(req: NextRequest) {
  if (!apiKey) {
    return NextResponse.json(
      { error: "LEMON_SQUEEZY_API_KEY is not set" },
      { status: 500 }
    );
  }
  if (!storeId) {
    return NextResponse.json(
      { error: "LEMON_SQUEEZY_STORE_ID is not set" },
      { status: 500 }
    );
  }

  let variantId: string | number;
  try {
    const body = await req.json().catch(() => ({}));
    variantId = body.variantId ?? body.variant_id;
    if (variantId == null || variantId === "") {
      return NextResponse.json(
        { error: "variantId is required" },
        { status: 400 }
      );
    }
    variantId = typeof variantId === "string" ? variantId : String(variantId);
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  lemonSqueezySetup({ apiKey });

  const { data, error } = await createCheckout(
    storeId,
    variantId,
    {
      checkoutOptions: {
        embed: true,
      },
    }
  );

  if (error) {
    console.error("[api/lemon/create-checkout]", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to create checkout" },
      { status: 500 }
    );
  }

  const url = data?.data?.attributes?.url;
  if (!url) {
    return NextResponse.json(
      { error: "No checkout URL returned" },
      { status: 500 }
    );
  }

  return NextResponse.json({ url });
}
