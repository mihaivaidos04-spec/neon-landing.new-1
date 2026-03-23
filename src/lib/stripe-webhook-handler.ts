import type Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import { addCoins } from "@/src/lib/wallet";
import { getSupabase } from "@/src/lib/supabase";
import { getBillingPackById } from "@/src/lib/billing-packs";
import { neonLevelFromXp, xpFromCoinsCredited } from "@/src/lib/neon-xp-level";
import { broadcastLegendPurchase } from "@/src/lib/broadcast-legend-purchase";
import { rewardReferrerOnReferredPurchase } from "@/src/lib/referral-service";
import { syncUserVipTierInTx } from "@/src/lib/vip-tier";

function isUniqueConstraintError(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

/**
 * Stripe `checkout.session.completed` — billing packs, platform plans, ghost mode.
 * Idempotency: `StripePurchase` row with unique `stripeSessionId` is created first;
 * duplicate events exit before mutating balances.
 */
export async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const meta = session.metadata ?? {};
  const userId = (meta.userId ?? session.client_reference_id ?? "").trim();
  if (!userId) {
    console.error("[stripe webhook] No userId in session metadata");
    return;
  }

  const coinsAmountRaw = parseInt(
    String(meta.coinsAmount ?? meta.coinAmount ?? meta.coinsToBuy ?? meta.coins ?? "0"),
    10
  );
  if (meta.checkout_kind === "billing_pack" && (!Number.isFinite(coinsAmountRaw) || coinsAmountRaw <= 0)) {
    console.error("[stripe webhook] Invalid or missing coinsAmount in metadata for billing_pack");
    return;
  }

  const sessionId = session.id;
  const amountUsd = (session.amount_total ?? 0) / 100;

  try {
    await prisma.stripePurchase.create({
      data: {
        userId,
        stripeSessionId: sessionId,
        status: "processing",
        amountUsd,
        coinsAdded: 0,
        currency: "USD",
      },
    });
  } catch (e) {
    if (isUniqueConstraintError(e)) {
      return;
    }
    throw e;
  }

  try {
    const checkoutKind = meta.checkout_kind ?? "";
    if (checkoutKind === "billing_pack") {
      await fulfillBillingPack(session, userId, sessionId, meta);
    } else {
      await fulfillPlanCheckout(session, userId, sessionId, meta);
    }

    await prisma.stripePurchase.update({
      where: { stripeSessionId: sessionId },
      data: { status: "completed" },
    });

    const paidCoins = parseInt(
      String(meta.coinAmount ?? meta.coinsAmount ?? meta.coinsToBuy ?? meta.coins ?? "0"),
      10
    );
    console.log(
      "Banii au intrat!",
      `${amountUsd} USD`,
      Number.isFinite(paidCoins) && paidCoins > 0 ? `(${paidCoins} coins)` : ""
    );
  } catch (err) {
    console.error("[stripe webhook] fulfillment failed", err);
    await prisma.stripePurchase.updateMany({
      where: { stripeSessionId: sessionId, status: "processing" },
      data: { status: "failed" },
    });
  }
}

async function fulfillBillingPack(
  session: Stripe.Checkout.Session,
  userId: string,
  sessionId: string,
  meta: Stripe.Metadata
): Promise<void> {
  const packId = meta.packId ?? "";
  const pack = getBillingPackById(packId);
  const expectedCents = meta.amount_cents ? parseInt(meta.amount_cents, 10) : NaN;
  const coinsFromMetadata = Math.max(
    0,
    parseInt(String(meta.coinsAmount ?? meta.coinAmount ?? meta.coinsToBuy ?? meta.coins ?? "0"), 10) || 0
  );

  if (!pack || pack.coins !== coinsFromMetadata || pack.amountCents !== expectedCents) {
    throw new Error("billing_pack metadata mismatch");
  }

  if (session.amount_total !== pack.amountCents) {
    throw new Error("amount_total does not match pack");
  }

  const coinsToBuy = coinsFromMetadata;
  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;

  const externalId = `stripe-checkout-${sessionId}`;
  const addResult = await addCoins(userId, coinsToBuy, {
    externalId,
    reason: "stripe_billing_pack",
  });
  if (!addResult.success) {
    throw new Error(addResult.error ?? "addCoins failed");
  }

  await prisma.$transaction(async (tx) => {
    const before = await tx.user.findUnique({
      where: { id: userId },
      select: { xp: true },
    });
    const xpAdd = xpFromCoinsCredited(coinsToBuy);
    const newXp = (before?.xp ?? 0) + xpAdd;
    const newLevel = neonLevelFromXp(newXp);

    await tx.user.update({
      where: { id: userId },
      data: {
        coins: { increment: coinsToBuy },
        hasEverPurchased: true,
        totalSpent: { increment: pack.priceUsd },
        xp: newXp,
        currentLevel: newLevel,
        ...(customerId ? { stripeCustomerId: customerId } : {}),
        ...(pack.id === "whale" ? { isVip: true } : {}),
      },
    });

    await tx.walletCreditTransaction.create({
      data: {
        userId,
        amount: coinsToBuy,
        status: "completed",
        provider: "stripe",
        stripeSessionId: sessionId,
      },
    });

    await tx.stripePurchase.update({
      where: { stripeSessionId: sessionId },
      data: {
        amountUsd: pack.priceUsd,
        coinsAdded: coinsToBuy,
        packId: pack.id,
      },
    });
  });

  await optionalPaymentLog(session, userId, sessionId, coinsToBuy, pack.id);

  // Global Pulse: Whale Pack → NEON LEGEND (see LegendPurchaseListener + Socket.io)
  if (pack.id === "whale") {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });
    const userName = u?.name?.trim() || u?.email?.split("@")[0] || "Someone";
    broadcastLegendPurchase({
      userId,
      userName,
      coinsAdded: coinsToBuy,
    });
  }

  await rewardReferrerOnReferredPurchase(userId);
}

async function fulfillPlanCheckout(
  session: Stripe.Checkout.Session,
  userId: string,
  sessionId: string,
  meta: Stripe.Metadata
): Promise<void> {
  const credits = Math.max(0, parseInt(meta.credits ?? "0", 10) || 0);
  const ghostMode = meta.ghost_mode === "true";
  const promocodeId = meta.promocode_id;

  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { hasEverPurchased: true },
  });
  if (!user) {
    throw new Error("User not found");
  }

  const wasFirstPurchase = !user.hasEverPurchased;

  await prisma.user.update({
    where: { id: userId },
    data: {
      hasEverPurchased: true,
      ...(customerId ? { stripeCustomerId: customerId } : {}),
      ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
    },
  });

  let bonusCredits = 0;
  if (promocodeId && wasFirstPurchase && credits > 0) {
    const promocode = await prisma.promocode.findUnique({ where: { id: promocodeId } });
    if (promocode) {
      bonusCredits = Math.floor(credits * (promocode.bonusPercent / 100));
      await prisma.promocode.update({
        where: { id: promocodeId },
        data: { usedCount: { increment: 1 } },
      });
    }
  }

  const totalCredits = credits + bonusCredits;

  const amountUsd = (session.amount_total ?? 0) / 100;

  if (totalCredits > 0) {
    const externalId = `stripe-checkout-${sessionId}`;
    const result = await addCoins(userId, totalCredits, {
      externalId,
      reason: "stripe_checkout",
    });
    if (!result.success) {
      console.error("[stripe webhook] addCoins failed:", result.error);
      throw new Error(result.error ?? "addCoins failed");
    }

    await prisma.$transaction(async (tx) => {
      const before = await tx.user.findUnique({
        where: { id: userId },
        select: { xp: true },
      });
      const xpAdd = xpFromCoinsCredited(totalCredits);
      const newXp = (before?.xp ?? 0) + xpAdd;
      const newLevel = neonLevelFromXp(newXp);

      await tx.user.update({
        where: { id: userId },
        data: {
          coins: { increment: totalCredits },
          totalSpent: { increment: amountUsd },
          xp: newXp,
          currentLevel: newLevel,
        },
      });

      await tx.walletCreditTransaction.create({
        data: {
          userId,
          amount: totalCredits,
          status: "completed",
          provider: "stripe",
          stripeSessionId: sessionId,
        },
      });

      await tx.stripePurchase.update({
        where: { stripeSessionId: sessionId },
        data: {
          amountUsd,
          coinsAdded: totalCredits,
          packId: meta.planId ?? null,
        },
      });

      await syncUserVipTierInTx(tx, userId);
    });
  } else {
    await prisma.stripePurchase.update({
      where: { stripeSessionId: sessionId },
      data: {
        amountUsd,
        coinsAdded: 0,
        packId: meta.planId ?? null,
      },
    });
  }

  if (ghostMode) {
    const supabase = getSupabase();
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
    await prisma.user.update({
      where: { id: userId },
      data: { isGhost: true },
    });
  }

  await optionalPaymentLog(session, userId, sessionId, totalCredits, meta.planId ?? null);
}

async function optionalPaymentLog(
  session: Stripe.Checkout.Session,
  userId: string,
  sessionId: string,
  coinsAdded: number,
  variantId: string | null
): Promise<void> {
  try {
    const supabase = getSupabase();
    await supabase.from("lemon_payment_log").insert({
      lemon_order_id: `stripe_${sessionId}`,
      lemon_order_number: null,
      user_email: session.customer_email ?? session.customer_details?.email ?? "",
      user_id: userId,
      variant_id: variantId,
      product_id: "stripe",
      amount_cents: session.amount_total ?? null,
      coins_added: coinsAdded,
      status: "paid",
      raw_meta: { stripe_session_id: sessionId },
    });
  } catch (e) {
    console.warn("[stripe webhook] optional log insert failed", e);
  }
}
