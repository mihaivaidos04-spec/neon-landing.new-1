"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useSession, signOut } from "next-auth/react";
import {
  readAgeVerifiedFromDocument,
  readAgeVerifiedFromLocalStorage,
  setAgeVerifiedCookie,
  setAgeVerifiedLocalStorage,
} from "../lib/age-verification-cookie";
import { getOrCreateGuestAlias } from "../lib/guest-identity";
import { getBrowserLocale, getContentT, type ContentLocale } from "../lib/content-i18n";
import type { DailyStreakModalPayload } from "@/src/components/DailyStreakModal";
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
import { formatNumber } from "../lib/format-intl";
import { useWallet } from "../hooks/useWallet";
import { useRewards } from "../hooks/useRewards";
import { useSessionSpending } from "../hooks/useSessionSpending";
import { useEnsureFilterAccess } from "../hooks/useEnsureFilterAccess";
import { useMission } from "../hooks/useMission";
import { useEffectiveViewerCountryCode } from "../hooks/useEffectiveViewerCountryCode";
import MobileBottomNav from "@/src/components/mobile/MobileBottomNav";
import LandingMobileSheet from "@/src/components/mobile/LandingMobileSheet";

const UserAvatar = dynamic(() => import("@/src/components/UserAvatar"), { ssr: false });
const GhostModeToggle = dynamic(() => import("@/src/components/GhostModeToggle"), { ssr: false });
const FirstPurchaseBonusTimer = dynamic(
  () => import("@/src/components/FirstPurchaseBonusTimer"),
  { ssr: false }
);
const LiveIndicator = dynamic(() => import("@/src/components/LiveIndicator"), { ssr: false });
const HeaderInviteShare = dynamic(() => import("@/src/components/HeaderInviteShare"), { ssr: false });
const SocialProofPopup = dynamic(
  () => import("@/src/components/SocialProofPopup"),
  { ssr: false }
);
const WelcomeToast = dynamic(
  () => import("@/src/components/WelcomeToast"),
  { ssr: false }
);
const BatteryIndicator = dynamic(() => import("@/src/components/BatteryIndicator"), { ssr: false });
const ContentSection = dynamic(
  () => import("@/src/components/ContentSection"),
  {
    ssr: true,
    loading: () => (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    ),
  }
);
const AgeVerificationModal = dynamic(
  () => import("@/src/components/AgeVerificationModal"),
  { ssr: false }
);
const BonusMultiplierPopup = dynamic(
  () => import("@/src/components/BonusMultiplierPopup"),
  { ssr: false }
);
const GlobalNotificationToast = dynamic(
  () => import("@/src/components/GlobalNotificationToast"),
  { ssr: false }
);
const DecryptRewardModal = dynamic(
  () => import("@/src/components/DecryptRewardModal"),
  { ssr: false }
);
const ShopModal = dynamic(() => import("@/src/components/ShopModal"), { ssr: false });
const NotificationBell = dynamic(() => import("@/src/components/NotificationBell"), { ssr: false });
const NeonParticleField = dynamic(() => import("@/src/components/NeonParticleField"), {
  ssr: false,
  loading: () => null,
});
const NeonLiveLogo = dynamic(() => import("@/src/components/NeonLiveLogo"), { ssr: false });
const UserNameWithFlag = dynamic(() => import("@/src/components/UserNameWithFlag"), { ssr: false });
const GlobalPulseChat = dynamic(() => import("@/src/components/GlobalPulseChat"), { ssr: false });
const GlobalPulseGuestPanel = dynamic(() => import("@/src/components/GlobalPulseGuestPanel"), {
  ssr: false,
});
const LoginWall = dynamic(() => import("@/src/components/LoginWall"), { ssr: false });
const NicknameSetupModal = dynamic(() => import("@/src/components/NicknameSetupModal"), { ssr: false });
const AiWhisperLandingHero = dynamic(
  () => import("@/src/components/landing/AiWhisperLanding").then((m) => ({ default: m.AiWhisperLandingHero })),
  { ssr: false }
);
const AiWhisperLandingRest = dynamic(
  () => import("@/src/components/landing/AiWhisperLanding").then((m) => ({ default: m.AiWhisperLandingRest })),
  { ssr: false }
);

const START_VIDEO_INTENT_KEY = "neon-start-video-after-auth";
const WelcomeBonusModal = dynamic(() => import("@/src/components/WelcomeBonusModal"), { ssr: false });
const DailyStreakModal = dynamic(() => import("@/src/components/DailyStreakModal"), { ssr: false });

/** Custom fields from NextAuth JWT/callbacks */
type AppSession = NonNullable<ReturnType<typeof useSession>["data"]> & {
  userId?: string;
  nickname?: string | null;
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
  /** 18+ gate only; guest enters directly after confirmation */
  const [ageGateResolved, setAgeGateResolved] = useState(false);
  const [ageGateOk, setAgeGateOk] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coins, setCoins] = useState(INITIAL_COINS);
  const [guestAlias, setGuestAlias] = useState("Guest");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showWelcomeToast, setShowWelcomeToast] = useState(false);
  const [showBonusMultiplierPopup, setShowBonusMultiplierPopup] = useState(false);
  const [showDecryptReward, setShowDecryptReward] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);
  const [showLoginWall, setShowLoginWall] = useState(false);
  const [showWelcomeBonusModal, setShowWelcomeBonusModal] = useState(false);
  const [showDailyStreakModal, setShowDailyStreakModal] = useState(false);
  const [dailyStreakPayload, setDailyStreakPayload] = useState<DailyStreakModalPayload | null>(null);
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
    setAgeGateOk(readAgeVerifiedFromDocument() || readAgeVerifiedFromLocalStorage());
    setAgeGateResolved(true);
  }, []);

  useEffect(() => {
    if (!mounted || status !== "unauthenticated") return;
    setGuestAlias(getOrCreateGuestAlias());
  }, [mounted, status]);

  useEffect(() => {
    if (!mounted) return;
    document.body.classList.add("single-screen-home");
    return () => {
      document.body.classList.remove("single-screen-home");
    };
  }, [mounted]);

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
    setAgeVerifiedLocalStorage();
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

  // Save UTM + apply referral code on sign-in
  const hasSavedAttributionRef = useRef(false);
  useEffect(() => {
    if (status !== "authenticated" || !mounted || hasSavedAttributionRef.current) return;
    const attribution = getStoredAttribution();
    if (!attribution?.utm_source && !attribution?.utm_medium && !attribution?.utm_campaign && !attribution?.ref)
      return;
    hasSavedAttributionRef.current = true;

    void (async () => {
      try {
        if (attribution.ref?.trim()) {
          await fetch("/api/referral/register", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: attribution.ref.trim() }),
          });
        }
        if (attribution.utm_source || attribution.utm_medium || attribution.utm_campaign) {
          await fetch("/api/attribution/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              utm_source: attribution.utm_source,
              utm_medium: attribution.utm_medium,
              utm_campaign: attribution.utm_campaign,
            }),
          });
        }
        clearStoredAttribution();
      } catch {
        /* ignore */
      }
    })();
  }, [status, mounted]);

  const signInWithDiscord = useCallback(() => {
    setShowLoginWall(true);
  }, []);

  const openGuestLoginPrompt = useCallback(() => {
    setShowLoginWall(true);
  }, []);

  const scrollToVideoStage = useCallback(() => {
    if (typeof document === "undefined") return;
    document.getElementById("neon-stage")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleStartTalkingFree = useCallback(() => {
    if (status === "unauthenticated") {
      try {
        sessionStorage.setItem(START_VIDEO_INTENT_KEY, "1");
      } catch {
        /* ignore */
      }
      setShowLoginWall(true);
      return;
    }
    scrollToVideoStage();
  }, [status, scrollToVideoStage]);

  const handleOpenShop = () => setShowShopModal(true);
  /** Guests: open unified login chooser. Logged-in: shop modal. */
  const handleCoinsPress = useCallback(() => {
    if (status === "unauthenticated") {
      signInWithDiscord();
      return;
    }
    setShowShopModal(true);
  }, [status, signInWithDiscord]);

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

  const [batteryHeader, setBatteryHeader] = useState<{ percent: number; loading: boolean }>({
    percent: 100,
    loading: true,
  });
  const handleBatteryDisplayChange = useCallback((s: { percent: number; loading: boolean }) => {
    setBatteryHeader(s);
  }, []);
  const locale = mounted ? getBrowserLocale() : "en";
  const t = getContentT(locale);
  const viewerCountryCode = useEffectiveViewerCountryCode(status, session?.countryCode);
  const showAgeGate = mounted && ageGateResolved && !ageGateOk;
  const canShowLanding = mounted && !showAgeGate;
  const authSession = session as AppSession | null | undefined;
  const needsNicknameSetup =
    status === "authenticated" && !authSession?.nickname?.trim();

  useEffect(() => {
    if (status !== "authenticated" || needsNicknameSetup || typeof window === "undefined") return;
    let pending = false;
    try {
      pending = sessionStorage.getItem(START_VIDEO_INTENT_KEY) === "1";
      if (pending) sessionStorage.removeItem(START_VIDEO_INTENT_KEY);
    } catch {
      /* ignore */
    }
    if (!pending) return;
    requestAnimationFrame(() => scrollToVideoStage());
  }, [status, needsNicknameSetup, scrollToVideoStage]);

  useEffect(() => {
    if (showLoginWall || status === "authenticated") return;
    try {
      sessionStorage.removeItem(START_VIDEO_INTENT_KEY);
    } catch {
      /* ignore */
    }
  }, [showLoginWall, status]);

  const handleNicknameSetupComplete = useCallback(async () => {
    try {
      const res = await fetch("/api/user/welcome-bonus", { method: "POST", credentials: "include" });
      const data = (await res.json().catch(() => ({}))) as { granted?: boolean };
      if (res.ok && data.granted) {
        setShowWelcomeBonusModal(true);
      }
    } catch {
      /* ignore */
    }
    await wallet.refetch();
  }, [wallet]);

  useEffect(() => {
    if (status !== "authenticated" || !mounted) return;
    try {
      if (sessionStorage.getItem("neon-welcome-bonus-pending") === "1") {
        sessionStorage.removeItem("neon-welcome-bonus-pending");
        setShowWelcomeBonusModal(true);
        void wallet.refetch();
      }
    } catch {
      /* ignore */
    }
  }, [status, mounted, wallet]);

  useEffect(() => {
    if (status !== "authenticated" || !mounted || needsNicknameSetup) return;

    void (async () => {
      try {
        const res = await fetch("/api/user/daily-login", { method: "POST", credentials: "include" });
        const data = (await res.json().catch(() => ({}))) as {
          showModal?: boolean;
          currentStreak?: number;
          coinsEarned?: number;
          weeklyBadge?: boolean;
          calendar?: DailyStreakModalPayload["calendar"];
          balance?: number;
        };
        if (res.ok && data.showModal) {
          setDailyStreakPayload({
            currentStreak: data.currentStreak ?? 1,
            coinsEarned: data.coinsEarned ?? 0,
            weeklyBadge: Boolean(data.weeklyBadge),
            calendar: data.calendar ?? [],
            balance: typeof data.balance === "number" ? data.balance : 0,
          });
          setShowDailyStreakModal(true);
        }
        await wallet.refetch();
      } catch {
        /* ignore */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per auth/nickname gate; not on every wallet tick
  }, [status, mounted, needsNicknameSetup]);

  return (
    <div className="relative flex h-[100dvh] max-h-[100dvh] max-w-[100vw] flex-col overflow-hidden bg-[#000000] text-white antialiased">
      <NeonParticleField />
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 30%, rgba(139, 92, 246, 0.05) 0%, rgba(57, 255, 20, 0.02) 40%, transparent 70%)",
        }}
      />
      {/* Header: Titlu + Conectare / Profile */}
      {canShowLanding && (
        <header className="relative z-20 shrink-0 max-w-[100vw] px-3 py-2 sm:px-6 sm:py-3">
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
              {status === "authenticated" && (
                <HeaderInviteShare locale={locale} userId={appUserId(session as AppSession)} />
              )}
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
                    <span className="text-[10px] font-bold tabular-nums text-[var(--color-text-secondary)]">
                      {rewards.pendingCount}
                    </span>
                  )}
                </button>
              )}
              {status === "authenticated" && (
                <GhostModeToggle
                  locale={locale}
                  userId={appUserId(session as AppSession)}
                  onOpenShop={handleOpenShop}
                />
              )}
              <div className="flex items-end gap-3 sm:gap-4">
                <div className="flex min-w-0 flex-col items-end gap-0.5 rounded-xl border border-emerald-500/25 bg-black/35 px-2.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  {batteryHeader.loading ? (
                    <span
                      className="h-5 w-20 shrink-0 animate-pulse rounded-md bg-white/15"
                      aria-hidden
                    />
                  ) : (
                    <BatteryIndicator percent={batteryHeader.percent} />
                  )}
                  {!batteryHeader.loading &&
                    batteryHeader.percent > 0 &&
                    batteryHeader.percent < 25 && (
                      <span className="hidden max-w-[6.5rem] text-right text-[9px] font-medium leading-tight text-amber-400/95 sm:block">
                        {t.batteryLowPowerWarning}
                      </span>
                    )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <button
                    type="button"
                    onClick={handleCoinsPress}
                    className="flex min-h-[48px] min-w-[100px] items-center justify-center gap-2 border-0 bg-transparent px-2 py-1 text-base font-normal text-[var(--color-text-secondary)] shadow-none transition-opacity hover:opacity-90 sm:min-h-0 sm:min-w-0"
                  >
                    {walletLoading ? (
                      <WalletSkeleton />
                    ) : (
                      <span className="number-plain tabular-nums">{formatNumber(displayCoins)}</span>
                    )}
                    <span>{t.coinsLabel}</span>
                  </button>
                  <div className="w-24 sm:w-28">
                    <RankProgressionBar coinsSpent={sessionSpent} />
                  </div>
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
                  onClick={signInWithDiscord}
                  className="min-h-12 rounded-full px-6 py-3 text-sm font-bold text-white ring-2 ring-violet-300/95 ring-offset-2 ring-offset-black transition-all hover:scale-[1.02] hover:shadow-[0_0_36px_rgba(196,181,253,0.55)] active:scale-[0.98] animate-[pulse-soft_2.8s_ease-in-out_infinite]"
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
                  <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-500/25 bg-black/40 px-1.5 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                    {batteryHeader.loading ? (
                      <span className="h-4 w-[4.25rem] animate-pulse rounded bg-white/15" aria-hidden />
                    ) : (
                      <BatteryIndicator percent={batteryHeader.percent} compact />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenShop}
                    className="flex min-h-11 min-w-11 flex-col items-center justify-center border-0 bg-transparent px-0 py-0 text-xs font-normal leading-tight text-[var(--color-text-secondary)] shadow-none"
                    aria-label={`${t.coinsLabel}: ${displayCoins.toLocaleString("en-US")}`}
                  >
                    {walletLoading ? (
                      <span className="h-4 w-8 animate-pulse rounded bg-white/20" />
                    ) : (
                      <span className="number-plain tabular-nums">{formatNumber(displayCoins)}</span>
                    )}
                    <span className="text-[9px] font-normal">{t.coinsLabel}</span>
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
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex shrink-0 flex-col items-center justify-center rounded-xl border border-emerald-500/25 bg-black/40 px-1.5 py-1">
                    {batteryHeader.loading ? (
                      <span className="h-4 w-16 animate-pulse rounded bg-white/15" aria-hidden />
                    ) : (
                      <BatteryIndicator percent={batteryHeader.percent} compact />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={signInWithDiscord}
                    className="min-h-11 min-w-0 shrink rounded-full px-4 py-2.5 text-xs font-bold text-white ring-2 ring-violet-300/90 ring-offset-2 ring-offset-black shadow-[0_0_24px_rgba(167,139,250,0.5)] transition active:scale-[0.98] sm:min-h-12 sm:px-5 sm:py-3 sm:text-sm animate-[pulse-soft_2.8s_ease-in-out_infinite]"
                    style={{ background: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)" }}
                  >
                    {t.connectAccount}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
      )}
      <main className="relative z-10 mx-auto flex min-h-0 w-full max-w-[100vw] flex-1 flex-col overflow-x-hidden overflow-y-auto px-2 pb-2 pt-2 sm:px-3 sm:pt-3 xl:px-4">
        {canShowLanding && status === "unauthenticated" && (
          <AiWhisperLandingHero
            onStartTalking={handleStartTalkingFree}
            onSeePricing={() => router.push("/billing")}
          />
        )}
        {canShowLanding && (
          <>
            {/* Theater row: wide video stage + narrow Global Pulse (mobile: stacked, scrollable) */}
            <div className="flex w-full min-h-[min(48dvh,440px)] flex-1 flex-col gap-2 xl:min-h-0 xl:flex-row xl:items-stretch xl:justify-start xl:gap-3 2xl:gap-4">
              <div
                id="neon-stage"
                className="min-h-0 min-w-0 w-full flex-1"
              >
                {canShowLanding && (
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
                  onRequireAuth={openGuestLoginPrompt}
                  onGuestPaywallTrigger={() => openGuestLoginPrompt()}
                  viewerDisplayName={
                    status === "authenticated"
                      ? (session?.user?.name ?? session?.user?.email ?? "You")
                      : guestAlias
                  }
                  onBatteryDisplayChange={handleBatteryDisplayChange}
                  onMobileChatOpen={() => setMobileMenuOpen(true)}
                  viewerNickname={authSession?.nickname ?? null}
                />
                )}
              </div>
              <div
                id="global-pulse"
                className="global-pulse-column relative z-[12] hidden min-h-0 w-full min-w-0 shrink-0 overflow-hidden xl:block xl:h-full xl:w-52 xl:max-w-[13.5rem]"
              >
                {canShowLanding && status === "authenticated" ? (
                  <GlobalPulseChat locale={locale} />
                ) : canShowLanding ? (
                  <GlobalPulseGuestPanel
                    locale={locale}
                    onOpenLogin={openGuestLoginPrompt}
                    onAttemptChat={openGuestLoginPrompt}
                  />
                ) : null}
              </div>
            </div>
            {canShowLanding && status === "unauthenticated" && <AiWhisperLandingRest />}
          </>
        )}
      </main>
      {canShowLanding && <SocialProofPopup locale={locale} />}
      {canShowLanding && (
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
      {status === "authenticated" && (
        <DecryptRewardModal
          visible={showDecryptReward}
          onClose={() => setShowDecryptReward(false)}
          onDecrypted={() => rewards.refetch()}
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
      {showAgeGate && (
        <AgeVerificationModal onAccept={handleAgeVerified} />
      )}
      {needsNicknameSetup && (
        <NicknameSetupModal
          open
          locale={locale as ContentLocale}
          onSuccess={() => void handleNicknameSetupComplete()}
        />
      )}
      <WelcomeBonusModal
        open={showWelcomeBonusModal}
        onClose={() => setShowWelcomeBonusModal(false)}
        locale={locale as ContentLocale}
      />
      <DailyStreakModal
        open={showDailyStreakModal}
        onClose={() => setShowDailyStreakModal(false)}
        payload={dailyStreakPayload}
        locale={locale as ContentLocale}
      />
      <LoginWall open={showLoginWall} onClose={() => setShowLoginWall(false)} locale={locale} />

      {canShowLanding && (
        <>
          <MobileBottomNav
            visible={false}
            authenticated={status === "authenticated"}
            onOpenShop={handleCoinsPress}
            onOpenLogin={signInWithDiscord}
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
                  className="min-h-12 w-full rounded-xl border border-white/15 py-3 text-sm font-medium text-white/90"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleOpenShop();
                  }}
                >
                  <span className="number-plain tabular-nums text-[var(--color-text-secondary)]">
                    {formatNumber(displayCoins)} {t.coinsLabel}
                  </span>{" "}
                  · Open shop
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
                  className="min-h-12 w-full rounded-xl border border-emerald-500/35 bg-emerald-950/25 py-3 text-sm font-medium text-emerald-200"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push("/referral");
                  }}
                >
                  Invite friends · earn coins
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
                    signInWithDiscord();
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
