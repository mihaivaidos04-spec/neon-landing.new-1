import { Prisma } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import { addCoins } from "@/src/lib/wallet";
import { createNotification } from "@/src/lib/create-notification";

export const REFERRED_SIGNUP_BONUS = 25;
export const REFERRER_SIGNUP_BONUS = 50;
export const REFERRER_PURCHASE_BONUS = 100;

/** Total coins distributed on signup (25 + 50) for Referral.coinsAwarded audit */
export const REFERRAL_SIGNUP_TOTAL_COINS = REFERRED_SIGNUP_BONUS + REFERRER_SIGNUP_BONUS;

export async function findReferrerByRefParam(ref: string): Promise<{ id: string } | null> {
  const trimmed = ref.trim();
  if (!trimmed) return null;
  const byCode = await prisma.user.findUnique({
    where: { referralCode: trimmed },
    select: { id: true },
  });
  if (byCode) return byCode;
  return prisma.user.findUnique({
    where: { id: trimmed },
    select: { id: true },
  });
}

async function rollbackReferralSignup(
  referrerId: string,
  referredId: string,
  prevReferrerCount: number,
  prevReferrerCoins: number
): Promise<void> {
  try {
    await prisma.referral.deleteMany({ where: { referredId } });
    await prisma.user.update({
      where: { id: referredId },
      data: { referredBy: null },
    });
    await prisma.user.update({
      where: { id: referrerId },
      data: {
        referralCount: prevReferrerCount,
        referralCoins: prevReferrerCoins,
      },
    });
  } catch (e) {
    console.error("[referral rollback]", e);
  }
}

export type RegisterReferralResult =
  | { ok: true; applied: false; reason: "already_linked" | "self" | "invalid_code" }
  | { ok: true; applied: true }
  | { ok: false; error: string };

/**
 * Link referred user to referrer, create Referral row, credit wallets.
 * Idempotent: if user already has referredBy or Referral row, returns applied: false.
 */
export async function registerReferral(referredId: string, code: string): Promise<RegisterReferralResult> {
  const trimmed = code.trim();
  if (!trimmed) {
    return { ok: true, applied: false, reason: "invalid_code" };
  }

  const referrer = await findReferrerByRefParam(trimmed);
  if (!referrer || referrer.id === referredId) {
    return { ok: true, applied: false, reason: referrer?.id === referredId ? "self" : "invalid_code" };
  }
  const referrerId = referrer.id;

  const existing = await prisma.referral.findUnique({
    where: { referredId },
  });
  if (existing) {
    return { ok: true, applied: false, reason: "already_linked" };
  }

  const referredUser = await prisma.user.findUnique({
    where: { id: referredId },
    select: { referredBy: true },
  });
  if (referredUser?.referredBy) {
    return { ok: true, applied: false, reason: "already_linked" };
  }

  const referrerBefore = await prisma.user.findUnique({
    where: { id: referrerId },
    select: { referralCount: true, referralCoins: true },
  });
  if (!referrerBefore) {
    return { ok: false, error: "Referrer not found" };
  }

  try {
    await prisma.$transaction([
      prisma.referral.create({
        data: {
          referrerId,
          referredId,
          coinsAwarded: REFERRAL_SIGNUP_TOTAL_COINS,
        },
      }),
      prisma.user.update({
        where: { id: referredId },
        data: { referredBy: referrerId },
      }),
      prisma.user.update({
        where: { id: referrerId },
        data: {
          referralCount: { increment: 1 },
          referralCoins: { increment: REFERRER_SIGNUP_BONUS },
        },
      }),
    ]);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: true, applied: false, reason: "already_linked" };
    }
    const msg = e instanceof Error ? e.message : "create failed";
    return { ok: false, error: msg };
  }

  const coinReferred = await addCoins(referredId, REFERRED_SIGNUP_BONUS, {
    externalId: `referral-signup-referred-${referredId}`,
    reason: "referral_signup_referred",
  });
  if (!coinReferred.success) {
    await rollbackReferralSignup(
      referrerId,
      referredId,
      referrerBefore.referralCount ?? 0,
      referrerBefore.referralCoins ?? 0
    );
    return { ok: false, error: coinReferred.error ?? "referred credit failed" };
  }

  const coinReferrer = await addCoins(referrerId, REFERRER_SIGNUP_BONUS, {
    externalId: `referral-signup-referrer-${referredId}`,
    reason: "referral_signup_referrer",
  });
  if (!coinReferrer.success) {
    await rollbackReferralSignup(
      referrerId,
      referredId,
      referrerBefore.referralCount ?? 0,
      referrerBefore.referralCoins ?? 0
    );
    return { ok: false, error: coinReferrer.error ?? "referrer credit failed" };
  }

  const referredProfile = await prisma.user.findUnique({
    where: { id: referredId },
    select: { name: true, nickname: true },
  });
  const joinedName =
    referredProfile?.nickname?.trim() || referredProfile?.name?.trim() || "Someone";
  await createNotification({
    userId: referrerId,
    type: "referral",
    title: "Referral joined",
    message: `👥 ${joinedName} joined using your link! +50 coins`,
    link: "/profile",
  });

  return { ok: true, applied: true };
}

/**
 * When a referred user completes a billing pack purchase, referrer gets a one-time bonus.
 */
export async function rewardReferrerOnReferredPurchase(buyerId: string): Promise<{ granted: boolean }> {
  const buyer = await prisma.user.findUnique({
    where: { id: buyerId },
    select: { referredBy: true },
  });
  const referrerId = buyer?.referredBy;
  if (!referrerId) {
    return { granted: false };
  }

  const res = await addCoins(referrerId, REFERRER_PURCHASE_BONUS, {
    externalId: `referral-purchase-${buyerId}`,
    reason: "referral_referred_purchase",
  });

  if (!res.success) {
    return { granted: false };
  }

  await prisma.user
    .update({
      where: { id: referrerId },
      data: { referralCoins: { increment: REFERRER_PURCHASE_BONUS } },
    })
    .catch(() => {});

  return { granted: true };
}
