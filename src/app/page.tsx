"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useSession, signOut } from "next-auth/react";
import { isVerificationValid } from "../lib/verification-storage";
import { readAgeVerifiedFromDocument, setAgeVerifiedCookie } from "../lib/age-verification-cookie";
import { getBrowserLocale, getContentT } from "../lib/content-i18n";
import { getRankFromCoinsSpent } from "../lib/ranks";
import RankBadge from "../components/RankBadge";
import WalletSkeleton from "../components/WalletSkeleton";
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
import { useEffectiveViewerCountryCode } from "../hooks/useEffectiveViewerCountryCode";
import MobileBottomNav from "@/src/components/mobile/MobileBottomNav";
import LandingMobileSheet from "@/src/components/mobile/LandingMobileSheet";

const UserAvatar = dynamic(() => import("../components/UserAvatar"), { ssr: false });
const GhostModeToggle = dynamic(() => import("../components/GhostModeToggle"), { ssr: false });
const FirstPurchaseBonusTimer = dynamic(
  () => import("../components/FirstPurchaseBonusTimer"),
  { ssr: false }
);
const Hero = dynamic(() => import("../components/HeroGlobal"), { ssr: true });
const LiveUsersInfinite = dynamic(() => import("../components/LiveUsersInfinite"), { ssr: false });
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
const AgeVerificationModal = dynamic(
  () => import("../components/AgeVerificationModal"),
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
const ShopModal = dynamic(() => import("@/src/components/ShopModal"), { ssr: false });
const NotificationBell = dynamic(() => import("@/src/components/NotificationBell"), { ssr: false });
const NeonParticleField = dynamic(() => import("@/src/components/NeonParticleField"), {
  ssr: false,
  loading: () => null,
});
const TimeOfDayGreeting = dynamic(() => import("@/src/components/TimeOfDayGreeting"), { ssr: false });
const NeonLiveLogo = dynamic(() => import("@/src/components/NeonLiveLogo"), { ssr: false });
const WelcomeBackMoment = dynamic(() => import("@/src/components/WelcomeBackMoment"), { ssr: false });
const UserNameWithFlag = dynamic(() => import("@/src/components/UserNameWithFlag"), { ssr: false });
const GlobalPulseChat = dynamic(() => import("@/src/components/GlobalPulseChat"), { ssr: false });
const GlobalPulseGuestPanel = dynamic(() => import("@/src/components/GlobalPulseGuestPanel"), {
  ssr: false,
});

/** Custom fields from NextAuth JWT/callbacks */
type AppSession = NonNullable<ReturnType<typeof useSession>["data"]> & {
  userId?: string;
  user?: NonNullable<NonNullable<ReturnType<typeof useSession>["data"]>["user"]> & { id?: string };
};

function appUserId(s: AppSession | null | undefined): string | null {
  if (!s) return null;
  return s.userId ?? s.user?.id ?? null;
}

function appUserMergeKey(s: AppSession | null | undefined): string {
  if (!s) return "id";
  return s.userId ?? s.user?.email ?? s.user?.name ?? "id";
}

export default function NeonLanding() {
  const { data: session, status, update: updateSession } = useSession();
  const wallet = useWallet(status === "authenticated");
  const rewards = useRewards(status === "authenticated");
  const mission = useMission(status === "authenticated");
  const [verified, setVerified] = useState(false);
  /** 18+ cookie gate — must pass before VerificationOverlay */
  const [ageGateResolved, setAgeGateResolved] = useState(false);
  const [ageGateOk, setAgeGateOk] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coins, setCoins] = useState(INITIAL_COINS);
  const [loginWallOpen, setLoginWallOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showWelcomeToast, setShowWelcomeToast] = useState(false);
  const [showBonusMultiplierPopup, setShowBonusMultiplierPopup] = useState(false);
  const [showMysteryBox, setShowMysteryBox] = useState(false);
  const [showDecryptReward, setShowDecryptReward] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);
  const [hasEverPurchased, setHasEverPurchased] = useState(true);
  const [loginAt, setLoginAt] = useState(0);
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
    setAgeGateOk(readAgeVerifiedFromDocument());
    setAgeGateResolved(true);
  }, []);

  /** One-shot: infer country from IP / edge headers when User.country is still empty */
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/me/sync-country", { method: "POST" })
      .then((r) => r.json())
      .then((d: { updated?: boolean }) => {
        if (d.updated) void updateSession?.();
      })
      .catch(() => {});
  }, [status, updateSession]);

  const handleAgeVerified = useCallback(() => {
    setAgeVerifiedCookie();
    setAgeGateOk(true);
  }, []);

  // Track login time for First Purchase Bonus timer
  useEffect(() => {
    if (status === "authenticated" && loginAt === 0) {
      setLoginAt(Date.now());
    }
  }, [status, loginAt]);

  // Fetch hasEverPurchased for First Purchase Bonus
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setHasEverPurchased(d.hasEverPurchased ?? true))
      .catch(() => setHasEverPurchased(true));
  }, [status]);

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
    const userId = appUserMergeKey(session as AppSession);
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

  const handleOpenShop = () => setShowShopModal(true);
  /** Guests: coins control opens login (save progress / real wallet). Logged-in: shop modal. */
  const handleCoinsPress = useCallback(() => {
    if (status === "unauthenticated") {
      setLoginWallOpen(true);
      return;
    }
    setShowShopModal(true);
  }, [status]);

  const handleOpenCheckout = () => router.push("/checkout");
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
  const viewerCountryCode = useEffectiveViewerCountryCode(status, session?.countryCode);

  return (
    <div className="min-h-screen max-w-[100vw] overflow-x-clip bg-[#000000] text-white antialiased">
      <NeonParticleField />
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 30%, rgba(139, 92, 246, 0.05) 0%, rgba(57, 255, 20, 0.02) 40%, transparent 70%)",
        }}
      />
      {/* Header: Titlu + Conectare / Profile */}
      {verified && mounted && (
        <header className="relative z-20 max-w-[100vw] px-3 py-2 sm:px-6 sm:py-3">
          <div className="mx-auto flex max-w-6xl min-w-0 items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <h1 className="m-0 flex min-w-0 items-center">
                <NeonLiveLogo
                  variant="header"
                  showHeartAccent
                  onHeartInteraction={handleHeartHover}
                  as="span"
                />
              </h1>
              <LiveIndicator />
            </div>

            {/* Desktop / large tablet toolbar */}
            <div className="hidden min-w-0 flex-1 flex-wrap items-center justify-end gap-2 lg:flex lg:gap-4">
              {rewards.pendingCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowDecryptReward(true)}
                  className="flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-emerald-500/50 bg-emerald-950/60 px-3 py-2 text-sm font-medium text-emerald-400 transition-all hover:bg-emerald-900/50 hover:border-emerald-500/70"
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
                className="flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-violet-500/50 bg-violet-950/60 px-3 py-2 text-sm font-medium text-violet-300 transition-all hover:bg-violet-900/50 hover:border-violet-500/70"
                title={t.mysteryBoxTitle}
              >
                <span>📦</span>
                <span className="hidden sm:inline">{t.mysteryBoxTitle}</span>
              </button>
              {status === "authenticated" && (
                <GhostModeToggle
                  locale={locale}
                  userId={appUserId(session as AppSession)}
                  onOpenShop={handleOpenShop}
                />
              )}
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  onClick={handleCoinsPress}
                  className="flex min-h-[48px] min-w-[100px] items-center justify-center gap-2 rounded-full px-4 py-3 text-base font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] sm:min-h-[52px] sm:min-w-[120px] sm:px-5"
                  style={{
                    background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                    boxShadow: "0 0 24px rgba(139, 92, 246, 0.35)",
                  }}
                >
                  {walletLoading ? (
                    <WalletSkeleton />
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
                  <NotificationBell />
                  <span className="hidden items-center gap-2 text-sm text-white/80 xl:inline-flex">
                    <RankBadge rank={getRankFromCoinsSpent(sessionSpent)} size="sm" />
                    <UserNameWithFlag
                      name={session?.user?.name ?? session?.user?.email ?? "User"}
                      countryCode={viewerCountryCode}
                      locale={locale}
                      nameClassName="text-sm text-white/80"
                    />
                  </span>
                  <UserAvatar
                    src={session?.user?.image}
                    tier={isWhale ? "whale" : sessionSpent < 50 ? "new" : "premium"}
                    isPremium={isWhale || sessionSpent >= 50}
                    size="sm"
                  />
                  <button
                    type="button"
                    onClick={() => router.push("/profile")}
                    className="min-h-11 rounded-full border border-white/20 px-4 py-2 text-xs font-medium text-white/80 transition-colors hover:bg-white/10"
                  >
                    Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="min-h-11 rounded-full border border-white/20 px-4 py-2 text-xs font-medium text-white/80 transition-colors hover:bg-white/10"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setLoginWallOpen(true)}
                  className="min-h-12 rounded-full px-6 py-3 text-sm font-bold text-white ring-2 ring-violet-300/95 ring-offset-2 ring-offset-black transition-all hover:scale-[1.02] hover:shadow-[0_0_36px_rgba(196,181,253,0.55)] active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 55%, #c084fc 100%)",
                    boxShadow: "0 0 28px rgba(167, 139, 250, 0.45)",
                  }}
                >
                  {t.connectAccount}
                </button>
              )}
            </div>

            {/* Mobile / small tablet: compact coins + menu */}
            <div className="flex shrink-0 items-center gap-2 lg:hidden">
              {status === "authenticated" && session?.user ? (
                <>
                  <button
                    type="button"
                    onClick={handleOpenShop}
                    className="flex min-h-11 min-w-11 flex-col items-center justify-center rounded-xl border border-violet-500/40 bg-violet-950/70 px-2 py-1 text-xs font-bold leading-tight text-white shadow-[0_0_16px_rgba(139,92,246,0.25)]"
                    aria-label={`${t.coinsLabel}: ${displayCoins}`}
                  >
                    {walletLoading ? (
                      <span className="h-4 w-8 animate-pulse rounded bg-white/20" />
                    ) : (
                      <span className="tabular-nums">{displayCoins}</span>
                    )}
                    <span className="text-[9px] font-medium text-violet-200/80">{t.coinsLabel}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(true)}
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-white/20 bg-white/5 text-white"
                    aria-label="Open menu"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setLoginWallOpen(true)}
                  className="min-h-12 rounded-full px-5 py-3 text-sm font-bold text-white ring-2 ring-violet-300/90 ring-offset-2 ring-offset-black shadow-[0_0_24px_rgba(167,139,250,0.5)] transition active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)" }}
                >
                  {t.connectAccount}
                </button>
              )}
            </div>
          </div>
        </header>
      )}
      {verified && mounted && (
        <>
          <div className="max-w-[100vw] overflow-x-hidden">
            <LiveTicker locale={locale} />
          </div>
          <TimeOfDayGreeting />
          <WelcomeBackMoment />
        </>
      )}
      {/* Guest banner: link account to save progress */}
      {verified && mounted && status === "unauthenticated" && coins > 0 && (
        <div className="relative z-20 mx-auto mt-2 flex max-w-6xl items-center justify-center gap-2 rounded-xl border border-violet-500/20 bg-violet-950/30 px-4 py-2.5 text-center text-sm text-[#faf5eb]/90 sm:mx-6">
          <span>{t.linkAccountToSaveProgress}</span>
          <button
            type="button"
            onClick={() => setLoginWallOpen(true)}
            className="font-semibold text-violet-300 underline hover:text-violet-200"
          >
            {t.connectAccount}
          </button>
        </div>
      )}
      <main className="relative z-10 mx-auto w-full max-w-[100vw] overflow-x-clip px-2 pt-4 pb-28 sm:px-4 sm:pt-6 sm:pb-14 md:pb-20 lg:pb-14 xl:px-5">
        {verified && (
          <>
            {/* Theater row: wide video stage + narrow Global Pulse (mobile: stacked, scrollable) */}
            <div className="flex w-full flex-col gap-4 xl:flex-row xl:items-start xl:justify-start xl:gap-3 2xl:gap-4">
              <div
                id="neon-stage"
                className="min-w-0 w-full flex-1 scroll-mt-4"
              >
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
                  missionTaskType={status === "authenticated" ? mission.taskType : undefined}
                  onMissionIncrement={status === "authenticated" ? handleMissionIncrement : undefined}
                  useRealMatching={status === "authenticated"}
                  userId={status === "authenticated" ? appUserId(session as AppSession) : null}
                  onWalletRefetch={status === "authenticated" ? wallet.refetch : undefined}
                  onNavigateToPrivate={(roomId) => router.push(`/private/${roomId}`)}
                  isWhale={status === "authenticated" ? isWhale : false}
                  sessionSpent={sessionSpent}
                  viewerCountryCode={viewerCountryCode}
                  isGuest={status === "unauthenticated"}
                  onRequireAuth={() => setLoginWallOpen(true)}
                />
              </div>
              <div
                id="global-pulse"
                className="global-pulse-column w-full min-w-0 shrink-0 scroll-mt-4 xl:sticky xl:top-[4.5rem] xl:w-52 xl:max-w-[13.5rem] xl:self-start"
              >
                {status === "authenticated" ? (
                  <GlobalPulseChat locale={locale} />
                ) : (
                  <GlobalPulseGuestPanel locale={locale} onOpenLogin={() => setLoginWallOpen(true)} />
                )}
              </div>
            </div>
            <Hero />
            <div className="mx-auto mt-12 flex max-w-6xl justify-center px-4">
              <div className="w-full max-w-sm">
                <LiveUsersInfinite />
              </div>
            </div>
            <div className="mx-auto mt-8 flex max-w-6xl justify-center px-4">
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
      {status === "authenticated" && loginAt > 0 && (
        <FirstPurchaseBonusTimer
          hasEverPurchased={hasEverPurchased}
          loginAt={loginAt}
          onOpenShop={handleOpenShop}
        />
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
      {showShopModal && (
        <ShopModal
          open={showShopModal}
          onClose={() => setShowShopModal(false)}
          coins={displayCoins}
          onSuccess={(newBalance) => {
            if (status === "authenticated") wallet.refetch();
            else setCoins(newBalance);
          }}
          onGetCoins={() => router.push("/billing")}
          locale="en"
        />
      )}
      {mounted && ageGateResolved && !ageGateOk && (
        <AgeVerificationModal onAccept={handleAgeVerified} />
      )}
      {mounted && ageGateResolved && ageGateOk && !verified && (
        <VerificationOverlay locale={locale} onVerified={handleVerified} />
      )}

      {verified && mounted && (
        <>
          <MobileBottomNav
            visible
            authenticated={status === "authenticated"}
            onOpenShop={handleCoinsPress}
            onOpenLogin={() => setLoginWallOpen(true)}
            onOpenMenu={() => setMobileMenuOpen(true)}
          />
          <LandingMobileSheet open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}>
            {status === "authenticated" && session?.user ? (
              <div className="flex flex-col gap-2">
                <div className="mb-1 flex min-h-14 items-center gap-3 border-b border-white/10 pb-3">
                  <UserAvatar
                    src={session?.user?.image}
                    tier={isWhale ? "whale" : sessionSpent < 50 ? "new" : "premium"}
                    isPremium={isWhale || sessionSpent >= 50}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <UserNameWithFlag
                      name={session?.user?.name ?? session?.user?.email ?? "User"}
                      countryCode={viewerCountryCode}
                      locale={locale}
                      nameClassName="text-sm font-semibold text-white"
                    />
                    <div className="mt-1">
                      <RankBadge rank={getRankFromCoinsSpent(sessionSpent)} size="sm" />
                    </div>
                  </div>
                </div>
                {rewards.pendingCount > 0 && (
                  <button
                    type="button"
                    className="min-h-12 w-full rounded-xl border border-emerald-500/40 bg-emerald-950/40 py-3 text-left text-sm font-medium text-emerald-300"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setShowDecryptReward(true);
                    }}
                  >
                    🔓 Decrypt Reward
                    {rewards.pendingCount > 1 ? ` (${rewards.pendingCount})` : ""}
                  </button>
                )}
                <button
                  type="button"
                  className="min-h-12 w-full rounded-xl border border-violet-500/40 bg-violet-950/40 py-3 text-left text-sm font-medium text-violet-200"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowMysteryBox(true);
                  }}
                >
                  📦 {t.mysteryBoxTitle}
                </button>
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <GhostModeToggle
                    locale={locale}
                    userId={appUserId(session as AppSession)}
                    onOpenShop={handleOpenShop}
                  />
                </div>
                <div className="flex min-h-12 items-center justify-between rounded-xl border border-white/10 px-3">
                  <span className="text-sm text-white/80">Notifications</span>
                  <NotificationBell />
                </div>
                <button
                  type="button"
                  className="min-h-12 w-full rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 py-3 text-sm font-semibold text-white"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleOpenShop();
                  }}
                >
                  {displayCoins} {t.coinsLabel} · Open shop
                </button>
                <button
                  type="button"
                  className="min-h-12 w-full rounded-xl border border-white/15 py-3 text-sm font-medium text-white"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push("/billing");
                  }}
                >
                  Billing & packs
                </button>
                <button
                  type="button"
                  className="min-h-12 w-full rounded-xl border border-white/15 py-3 text-sm font-medium text-white"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push("/profile");
                  }}
                >
                  Profile
                </button>
                <button
                  type="button"
                  className="min-h-12 w-full rounded-xl border border-red-500/30 py-3 text-sm font-medium text-red-300"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut();
                  }}
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  className="min-h-12 w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3 text-sm font-semibold text-white"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setLoginWallOpen(true);
                  }}
                >
                  {t.connectAccount}
                </button>
                <button
                  type="button"
                  className="min-h-12 w-full rounded-xl border border-white/15 py-3 text-sm font-medium text-white/90"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push("/billing");
                  }}
                >
                  View coin packs
                </button>
              </div>
            )}
          </LandingMobileSheet>
        </>
      )}
    </div>
  );
}
