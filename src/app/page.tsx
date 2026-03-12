"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useSession, signOut } from "next-auth/react";
import { isVerificationValid } from "../lib/verification-storage";
import { getBrowserLocale, getContentT } from "../lib/content-i18n";
import { getRankFromCoinsSpent } from "../lib/ranks";
import RankBadge from "../components/RankBadge";
import RankProgressionBar from "../components/RankProgressionBar";
import { INITIAL_COINS } from "../lib/coins";
import {
  getStoredGuestCoins,
  setStoredGuestCoins,
  clearGuestCoins,
  hasReceivedFirstLoginBonus,
  setFirstLoginBonusReceived,
  getFirstLoginBonusAmount,
} from "../lib/guest-storage";
import { getStoredAttribution, clearStoredAttribution } from "../lib/utm-storage";
import { feedbackSuccess, playSuccessSound } from "../lib/feedback";
import { useWallet } from "../hooks/useWallet";
import { useRewards } from "../hooks/useRewards";
import { useSessionSpending } from "../hooks/useSessionSpending";
import { useEnsureFilterAccess } from "../hooks/useEnsureFilterAccess";
import { useMission } from "../hooks/useMission";

const Hero = dynamic(() => import("../components/Hero"), { ssr: true });
const MicroAd = dynamic(() => import("../components/MicroAd"), { ssr: false });
const LiveIndicator = dynamic(() => import("../components/LiveIndicator"), { ssr: false });
const FaqSection = dynamic(() => import("../components/FaqSection"), { ssr: true });
const ComingSoonLevel50 = dynamic(() => import("../components/ComingSoonLevel50"), { ssr: true });
const SocialProofPopup = dynamic(
  () => import("../components/SocialProofPopup"),
  { ssr: false }
);
const WelcomeToast = dynamic(
  () => import("../components/WelcomeToast"),
  { ssr: false }
);
const ContentSection = dynamic(
  () => import("../components/ContentSection"),
  {
    ssr: true,
    loading: () => (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    ),
  }
);
const LoginWall = dynamic(() => import("../components/LoginWall"), { ssr: false });
const VerificationOverlay = dynamic(
  () => import("../components/VerificationOverlay"),
  { ssr: false }
);
const BonusMultiplierPopup = dynamic(
  () => import("../components/BonusMultiplierPopup"),
  { ssr: false }
);
const GlobalNotificationToast = dynamic(
  () => import("../components/GlobalNotificationToast"),
  { ssr: false }
);
const LiveTicker = dynamic(
  () => import("../components/LiveTicker"),
  { ssr: false }
);
const MysteryBoxModal = dynamic(
  () => import("../components/MysteryBoxModal"),
  { ssr: false }
);
const DecryptRewardModal = dynamic(
  () => import("../components/DecryptRewardModal"),
  { ssr: false }
);

export default function NeonLanding() {
  const { data: session, status } = useSession();
  const wallet = useWallet(status === "authenticated");
  const rewards = useRewards(status === "authenticated");
  const mission = useMission(status === "authenticated");
  const [verified, setVerified] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coins, setCoins] = useState(INITIAL_COINS);
  const [loginWallOpen, setLoginWallOpen] = useState(false);
  const [showWelcomeToast, setShowWelcomeToast] = useState(false);
  const [showBonusMultiplierPopup, setShowBonusMultiplierPopup] = useState(false);
  const [showMysteryBox, setShowMysteryBox] = useState(false);
  const [showDecryptReward, setShowDecryptReward] = useState(false);
  const router = useRouter();
  const hasAppliedFirstLoginRef = useRef(false);
  const heartSoundCooldownRef = useRef(0);

  const handleHeartHover = useCallback(() => {
    const now = Date.now();
    if (now - heartSoundCooldownRef.current < 800) return;
    heartSoundCooldownRef.current = now;
    playSuccessSound();
  }, []);

  useEffect(() => {
    setMounted(true);
    if (isVerificationValid()) setVerified(true);
  }, []);

  // Guest coins: init from storage when not signed in
  useEffect(() => {
    if (!mounted || status === "loading") return;
    if (status === "unauthenticated") {
      const stored = getStoredGuestCoins();
      if (stored > 0) setCoins(stored);
      else setCoins(INITIAL_COINS);
    }
  }, [mounted, status]);

  // Persist guest coins when not signed in
  useEffect(() => {
    if (!mounted || status === "authenticated") return;
    setStoredGuestCoins(coins);
  }, [mounted, status, coins]);

  // First-login bonus + merge guest coins when user signs in
  useEffect(() => {
    if (status !== "authenticated" || !session?.user || !mounted) return;
    const userId = (session as any).userId ?? session.user?.email ?? session.user?.name ?? "id";
    if (hasAppliedFirstLoginRef.current) return;
    hasAppliedFirstLoginRef.current = true;
    const guestCoins = getStoredGuestCoins();
    clearGuestCoins();
    const bonus = !hasReceivedFirstLoginBonus(userId) ? getFirstLoginBonusAmount() : 0;
    const totalToAdd = guestCoins + bonus;
    if (bonus > 0) {
      setFirstLoginBonusReceived(userId);
      feedbackSuccess();
    }
    if (totalToAdd > 0) {
      fetch("/api/wallet/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalToAdd,
          externalId: `first-login-${userId}`,
          reason: "first_login_merge",
        }),
      }).then(() => wallet.refetch());
    }
    setCoins(INITIAL_COINS);
  }, [status, session, mounted]);

  // Ensure welcome coins for new OAuth users (Google/Apple/Snapchat)
  const hasCheckedWelcomeRef = useRef(false);
  useEffect(() => {
    if (status !== "authenticated" || !mounted || hasCheckedWelcomeRef.current) return;
    hasCheckedWelcomeRef.current = true;
    fetch("/api/wallet/ensure-welcome")
      .then((res) => res.json())
      .then((data) => {
        if (data.credited) {
          setShowWelcomeToast(true);
          wallet.refetch();
        }
      })
      .catch(() => {});
  }, [status, mounted, wallet]);

  // Save UTM + ref attribution to user profile on sign-in
  const hasSavedAttributionRef = useRef(false);
  useEffect(() => {
    if (status !== "authenticated" || !mounted || hasSavedAttributionRef.current) return;
    const attribution = getStoredAttribution();
    if (!attribution?.utm_source && !attribution?.utm_medium && !attribution?.utm_campaign && !attribution?.ref) return;
    hasSavedAttributionRef.current = true;
    fetch("/api/attribution/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        utm_source: attribution.utm_source,
        utm_medium: attribution.utm_medium,
        utm_campaign: attribution.utm_campaign,
        ref: attribution.ref,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.saved) clearStoredAttribution();
      })
      .catch(() => {});
  }, [status, mounted]);

  const handleVerified = () => setVerified(true);

  const handleOpenShop = () => router.push("/checkout");
  const handleRechargeWithPayment = () => router.push("/checkout?bundle=starter");

  const { addSpend: addSessionSpend, isWhale, sessionSpent } = useSessionSpending();

  const handleSpend = useCallback(
    async (amount: number, _reason?: string) => {
      const res = await fetch("/api/wallet/spend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, reason: _reason }),
      });
      if (res.ok) {
        addSessionSpend(amount);
        await wallet.refetch();
        return true;
      }
      return false;
    },
    [wallet, addSessionSpend]
  );

  const ensureFilterAccess = useEnsureFilterAccess({
    onDenied: handleOpenShop,
    onSpend: status === "authenticated" ? handleSpend : undefined,
    onRefetch: status === "authenticated" ? wallet.refetch : undefined,
  });

  const handleMissionIncrement = useCallback(async (connectionDurationMs: number) => {
    const result = await mission.increment(connectionDurationMs);
    if (result?.justCompleted) {
      await wallet.refetch();
      setShowBonusMultiplierPopup(true);
    }
    return result ? { justCompleted: result.justCompleted } : null;
  }, [mission, wallet]);

  const handleAddCoins = useCallback(
    async (amount: number) => {
      const res = await fetch("/api/wallet/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, reason: "daily_quest" }),
      });
      if (res.ok) await wallet.refetch();
    },
    [wallet]
  );

  const displayCoins = status === "authenticated" ? (wallet.balance ?? 0) : coins;
  const walletLoading = status === "authenticated" && wallet.isLoading;
  const locale = mounted ? getBrowserLocale() : "en";
  const t = getContentT(locale);

  return (
    <div className="min-h-screen bg-[#000000] text-white antialiased">
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(139, 92, 246, 0.12) 0%, transparent 60%)",
        }}
      />
      {/* Header: Titlu + Conectare / Profile */}
      {verified && mounted && (
        <header className="relative z-20 flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <h1
              className="flex items-center text-xl font-light italic tracking-tight text-white sm:text-2xl"
              style={{ fontFamily: "var(--font-script), system-ui" }}
            >
              <span className="mr-0.5 sm:mr-1">Neon</span>
              <span
                className="logo-hearts group ml-2 flex cursor-pointer items-center gap-1 sm:ml-3 sm:gap-1.5"
                onMouseEnter={handleHeartHover}
                role="img"
                aria-label="Neon"
              >
                <span
                  className="heart-rotate-a relative inline-flex h-5 w-5 items-center justify-center sm:h-6 sm:w-6"
                >
                  <svg viewBox="0 0 24 24" fill="#f472b6" className="h-full w-full">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </span>
                <span
                  className="heart-rotate-b relative inline-flex h-5 w-5 items-center justify-center sm:h-6 sm:w-6"
                >
                  <svg viewBox="0 0 24 24" fill="#f472b6" className="h-full w-full">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </span>
              </span>
            </h1>
            <LiveIndicator />
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {rewards.pendingCount > 0 && (
              <button
                type="button"
                onClick={() => setShowDecryptReward(true)}
                className="flex items-center justify-center gap-1.5 rounded-full border border-emerald-500/50 bg-emerald-950/60 px-3 py-2 text-sm font-medium text-emerald-400 transition-all hover:bg-emerald-900/50 hover:border-emerald-500/70"
                title="Decrypt Reward"
              >
                <span>🔓</span>
                <span className="hidden sm:inline">Decrypt Reward</span>
                {rewards.pendingCount > 1 && (
                  <span className="rounded-full bg-emerald-500/30 px-1.5 text-[10px] font-bold">
                    {rewards.pendingCount}
                  </span>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowMysteryBox(true)}
              className="flex items-center justify-center gap-1.5 rounded-full border border-amber-500/50 bg-amber-950/60 px-3 py-2 text-sm font-medium text-amber-400 transition-all hover:bg-amber-900/50 hover:border-amber-500/70"
              title={t.mysteryBoxTitle}
            >
              <span>📦</span>
              <span className="hidden sm:inline">{t.mysteryBoxTitle}</span>
            </button>
            <div className="flex flex-col items-end gap-1">
              <button
                type="button"
                onClick={handleOpenShop}
                className="flex min-h-[48px] min-w-[100px] items-center justify-center gap-2 rounded-full px-4 py-3 text-base font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] sm:min-h-[52px] sm:min-w-[120px] sm:px-5"
                style={{ background: "#8b5cf6", boxShadow: "0 0 20px rgba(139, 92, 246, 0.4)" }}
              >
                {walletLoading ? (
                  <span className="neon-spinner-sm" aria-hidden />
                ) : (
                  <span>{displayCoins}</span>
                )}
                <span className="text-white/90">{t.coinsLabel}</span>
              </button>
              <div className="w-24 sm:w-28">
                <RankProgressionBar coinsSpent={sessionSpent} />
              </div>
            </div>
            {status === "authenticated" && session?.user ? (
            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-2 text-sm text-white/80 sm:inline-flex">
                <RankBadge rank={getRankFromCoinsSpent(sessionSpent)} size="sm" />
                {session?.user?.name ?? session?.user?.email ?? "User"}
              </span>
              {session?.user?.image && (
                <img
                  src={session?.user?.image}
                  alt=""
                  className="h-8 w-8 rounded-full border border-white/20 object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => signOut()}
                className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/10"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setLoginWallOpen(true)}
              className="rounded-full bg-[#8b5cf6] px-4 py-2 text-sm font-semibold text-white transition-all hover:shadow-[0_0_20px_rgba(139,92,246,0.5)]"
            >
              {t.connectAccount}
            </button>
          )}
          </div>
        </header>
      )}
      {verified && mounted && (
        <LiveTicker locale={locale} />
      )}
      {/* Guest banner: link account to save progress */}
      {verified && mounted && status === "unauthenticated" && coins > 0 && (
        <div className="relative z-20 mx-4 mt-2 flex items-center justify-center gap-2 rounded-xl border border-[#8b5cf6]/30 bg-[#8b5cf6]/10 px-4 py-2.5 text-center text-sm text-white/90 sm:mx-6">
          <span>{t.linkAccountToSaveProgress}</span>
          <button
            type="button"
            onClick={() => setLoginWallOpen(true)}
            className="font-semibold text-[#a78bfa] underline hover:opacity-90"
          >
            {t.connectAccount}
          </button>
        </div>
      )}
      <main className="relative z-10 mx-auto max-w-6xl px-4 pt-4 pb-10 sm:px-6 sm:pt-6 sm:pb-14 md:pb-20">
        {verified && (
          <>
            <ContentSection
              locale={locale}
              coins={displayCoins}
              setCoins={setCoins}
              onOpenShop={handleOpenShop}
              onRechargeWithPayment={handleRechargeWithPayment}
              onOpenGenderFilter={() => router.push("/checkout?plan=gender")}
              onSpend={status === "authenticated" ? handleSpend : undefined}
              onAddCoins={status === "authenticated" ? handleAddCoins : undefined}
              ensureFilterAccess={status === "authenticated" ? ensureFilterAccess : undefined}
              missionCount={status === "authenticated" ? mission.count : undefined}
              missionCompleted={status === "authenticated" ? mission.completed : undefined}
              onMissionIncrement={status === "authenticated" ? handleMissionIncrement : undefined}
              useRealMatching={status === "authenticated"}
              userId={status === "authenticated" ? ((session as any)?.userId ?? session?.user?.id) ?? null : null}
              onWalletRefetch={status === "authenticated" ? wallet.refetch : undefined}
              onNavigateToPrivate={(roomId) => router.push(`/private/${roomId}`)}
              isWhale={status === "authenticated" ? isWhale : false}
              sessionSpent={sessionSpent}
            />
            <Hero />
            <div className="mx-auto mt-8 flex justify-center">
              <MicroAd format="horizontal" />
            </div>
            <FaqSection locale={locale} />
            <ComingSoonLevel50 locale={locale} />
          </>
        )}
      </main>
      {verified && <SocialProofPopup locale={locale} />}
      {verified && mounted && (
        <GlobalNotificationToast locale={locale} />
      )}
      {showWelcomeToast && (
        <WelcomeToast
          message={t.welcomeToastMessage}
          onDismiss={() => setShowWelcomeToast(false)}
        />
      )}
      {status === "authenticated" && (
        <BonusMultiplierPopup
          visible={showBonusMultiplierPopup}
          onClose={() => setShowBonusMultiplierPopup(false)}
          balance={displayCoins}
          onRefetch={wallet.refetch}
          locale={locale}
        />
      )}
      {verified && (
        <LoginWall
          open={loginWallOpen}
          onClose={() => setLoginWallOpen(false)}
          locale={locale}
        />
      )}
      {status === "authenticated" && (
        <DecryptRewardModal
          visible={showDecryptReward}
          onClose={() => setShowDecryptReward(false)}
          onDecrypted={() => rewards.refetch()}
        />
      )}
      {verified && mounted && (
        <MysteryBoxModal
          visible={showMysteryBox}
          onClose={() => setShowMysteryBox(false)}
          coins={displayCoins}
          onSpend={status === "authenticated" ? handleSpend : undefined}
          setCoins={status === "authenticated" ? undefined : setCoins}
          onOpenShop={handleOpenShop}
          onWalletRefetch={status === "authenticated" ? wallet.refetch : undefined}
        />
      )}
      {mounted && !verified && (
        <VerificationOverlay locale={locale} onVerified={handleVerified} />
      )}
    </div>
  );
}
