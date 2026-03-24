"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ContentLocale } from "../lib/content-i18n";
import type { FilterType } from "../lib/access";
import { getContentT } from "../lib/content-i18n";
import { BEAUTY_BLUR_COST_PER_MIN, GHOST_MODE_COST_PER_2MIN, GHOST_MODE_INTERVAL_MS, LIVE_TRANSLATION_COST_PER_MIN, UNDO_NEXT_COST, INSTANT_REVEAL_COST, BATTERY_QUICK_CHARGE_COST, BATTERY_QUICK_CHARGE_AMOUNT, PRIVATE_ROOM_COST_PER_MIN } from "../lib/coins";
import { feedbackClick, feedbackSuccess, playLowBatterySound, playGiftSound, playWhooshSound, triggerPremiumGiftHaptic } from "../lib/feedback";
import { getDailyQuestProgress, setDailyQuestProgress } from "../lib/daily-quest-storage";
import DailyQuestPanel, { DAILY_GOAL, DAILY_REWARD_COINS } from "./DailyQuestPanel";
import DailyRewardCalendar from "./DailyRewardCalendar";
import { type GiftId, getGiftName } from "./GiftsBar";
import type { PartnerVideoGiftPayload } from "./PartnerVideoGiftOverlay";
import {
  type TheaterGiftId,
  canAffordTheaterGift,
  getTheaterGiftCost,
} from "../lib/theater-gifts";
import { GiftShopQuestStack } from "./GiftShopPanel";
import StageLeftRail from "./StageLeftRail";
import type { ActiveGift } from "./GiftLayer";
import VideoBridge from "./VideoBridge";
import MobileVideoSwipeStart from "./MobileVideoSwipeStart";
import VideoAdOverlay from "./VideoAdOverlay";
import GenderFilterCTA from "./GenderFilterCTA";
import MatchFilterBar, { type MatchFilter } from "./MatchFilterBar";
import MatchTargetCountryBar from "./MatchTargetCountryBar";
import QueuePreview from "./QueuePreview";
import PrivateInviteModal from "./PrivateInviteModal";
import NeonLiveLogo from "./NeonLiveLogo";
import { useSocketContext } from "../contexts/SocketContext";
import type { VideoFilterId } from "../lib/video-filters";
import type { ReactionId } from "../lib/reactions";
import { getReactionCost } from "../lib/coins";
import { useReactions } from "../hooks/useReactions";
import { useLeaderboard } from "../hooks/useLeaderboard";
import { useDailyReward } from "../hooks/useDailyReward";
import BatteryDepletedModal from "./BatteryDepletedModal";
import BioCard from "./BioCard";
import ModerationViolationModal from "./ModerationViolationModal";
import SessionSummaryModal from "./SessionSummaryModal";
import { useVideoModeration } from "../hooks/useVideoModeration";
import { getStoredGuestBattery, setStoredGuestBattery } from "../lib/guest-storage";
import { getRankFromCoinsSpent } from "../lib/ranks";
import { isShadowBanned } from "../lib/report-shadow-ban";
import { pickRandomDemoCountry } from "../lib/demo-country-pool";
import toast from "react-hot-toast";
import { withConfetti } from "../lib/safe-confetti";
import type { Options } from "canvas-confetti";
import {
  getStoredTranslationTargetCode,
  setStoredTranslationTargetCode,
  TRANSLATION_TARGET_OPTIONS,
} from "../lib/translation-target-options";
import { useDevice } from "../hooks/useDevice";

/** Demo: 2 min premium countdown; when 0, silent downgrade + blur + system messages */
const PREMIUM_DURATION_SEC = 120;
const BEAUTY_BLUR_FREE_SEC = 30;

type Props = {
  locale?: ContentLocale;
  coins: number;
  setCoins: (fn: (prev: number) => number) => void;
  onOpenShop: () => void;
  /** When provided (auth users with wallet), spend goes through API instead of setCoins */
  onSpend?: (amount: number, reason?: string) => Promise<boolean>;
  /** When provided (auth users with wallet), add goes through API instead of setCoins */
  onAddCoins?: (amount: number) => Promise<void>;
  /** When provided, checks access before filtered skip; on deny opens Bănuți & Passuri */
  ensureFilterAccess?: (filterType: FilterType) => Promise<boolean>;
  /** When provided (auth users), mission progress from API; otherwise uses localStorage */
  missionCount?: number;
  missionCompleted?: boolean;
  missionTaskType?: "connections" | "messages";
  onMissionIncrement?: (connectionDurationMs: number) => Promise<{ justCompleted: boolean } | null>;
  /** When true, use real priority-based matching API instead of simulated delay */
  useRealMatching?: boolean;
  /** Current user ID (for reactions subscription and API) */
  userId?: string | null;
  /** Refetch wallet after reaction (auth users) */
  onWalletRefetch?: () => void | Promise<void>;
  /** Navigate to private room (for invite flow) */
  onNavigateToPrivate?: (roomId: string) => void;
  /** Spending tier: user has spent >$20 in session (Whale) */
  isWhale?: boolean;
  /** Total coins spent this session (for rank display) */
  sessionSpent?: number;
  /** ISO country for current user (chat flags) */
  viewerCountryCode?: string | null;
  /** Guest: sensitive interactions open login instead of acting */
  isGuest?: boolean;
  onRequireAuth?: () => void;
  onGuestPaywallTrigger?: (source: "chat" | "gift" | "next_limit") => void;
  /** Shown on gift overlay (e.g. session name) */
  viewerDisplayName?: string | null;
  /** Video-chat display name on own camera panel */
  viewerNickname?: string | null;
  /** Push battery % / loading to parent header (toolbar next to coins) */
  onBatteryDisplayChange?: (state: { percent: number; loading: boolean }) => void;
  /** Below md: Ome bar chat icon — e.g. open mobile menu (auth) */
  onMobileChatOpen?: () => void;
};

const MATCH_POLL_MS = 500;
const MATCH_TIMEOUT_MS = 30000;
/** Desktop (Tailwind lg): săgeata dreaptă = același lucru ca START / NEXT */
const NEXT_KEY_DESKTOP_MIN_WIDTH_PX = 1024;

function isKeyboardTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest("[contenteditable='true'], [role='textbox']"));
}
/** ~3% / min apel — ~25% în ~8–9 min (mai lent decât 5%/min) */
const BATTERY_DRAIN_MS = 60 * 1000;
const BATTERY_DRAIN_VIP_MS = 2 * 60 * 1000; // VIP: același drain la 2× interval
const BATTERY_HEARTBEAT_DRAIN = 3;

export default function ContentSection({
  locale = "en",
  coins,
  setCoins,
  onOpenShop,
  onSpend,
  onAddCoins,
  ensureFilterAccess,
  missionCount,
  missionCompleted,
  missionTaskType,
  onMissionIncrement,
  useRealMatching = false,
  userId = null,
  onWalletRefetch,
  onNavigateToPrivate,
  isWhale = false,
  sessionSpent = 0,
  viewerCountryCode = null,
  isGuest = false,
  onRequireAuth,
  onGuestPaywallTrigger,
  viewerDisplayName = null,
  viewerNickname = null,
  onBatteryDisplayChange,
  onMobileChatOpen,
}: Props) {
  const { isMobile, isDesktop } = useDevice();
  const [activeGift, setActiveGift] = useState<ActiveGift | null>(null);
  const [partnerVideoGift, setPartnerVideoGift] =
    useState<PartnerVideoGiftPayload | null>(null);
  const [topSupportersRefreshKey, setTopSupportersRefreshKey] = useState(0);
  const [searching, setSearching] = useState(true);
  const [connected, setConnected] = useState(false);
  const [premiumSecondsLeft, setPremiumSecondsLeft] = useState<number | null>(PREMIUM_DURATION_SEC);
  const [connectionDegraded, setConnectionDegraded] = useState(false);
  const [dailyQuestCount, setDailyQuestCount] = useState(0);
  const [dailyQuestCompleted, setDailyQuestCompleted] = useState(false);
  const [nextCount, setNextCount] = useState(0);
  const [showVideoAd, setShowVideoAd] = useState(false);
  const [showGenderFilterCTA, setShowGenderFilterCTA] = useState(false);
  const [activeFilter, setActiveFilter] = useState<VideoFilterId>("none");
  const [beautyBlurFreeSecondsLeft, setBeautyBlurFreeSecondsLeft] = useState(BEAUTY_BLUR_FREE_SEC);
  const [beautyBlurPaid, setBeautyBlurPaid] = useState(false);
  const [beautyBlurOverlayVisible, setBeautyBlurOverlayVisible] = useState(false);
  const [beautyBlurLoading, setBeautyBlurLoading] = useState(false);
  const [ghostMode, setGhostMode] = useState(false);
  // Load initial ghost status + sync with header Ghost toggle
  useEffect(() => {
    if (userId) {
      fetch("/api/ghost/status")
        .then((r) => r.json())
        .then((d) => {
          if (d.isGhostModeEnabled) {
            setGhostMode(true);
            setGhostModeChargedAt(Date.now());
          }
        })
        .catch(() => {});
    }
  }, [userId]);
  useEffect(() => {
    const handler = (e: CustomEvent<{ enabled: boolean }>) => {
      setGhostMode(!!e.detail?.enabled);
      if (e.detail?.enabled) setGhostModeChargedAt(Date.now());
    };
    window.addEventListener("ghost-mode-changed", handler as EventListener);
    return () => window.removeEventListener("ghost-mode-changed", handler as EventListener);
  }, []);
  const [liveTranslationEnabled, setLiveTranslationEnabled] = useState(false);
  const [translateTargetCode, setTranslateTargetCode] = useState("en");
  const [translationRemainSec, setTranslationRemainSec] = useState<number | null>(null);
  const [translationUnlimited, setTranslationUnlimited] = useState(false);
  const translationRemainSecRef = useRef(0);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [partnerNickname, setPartnerNickname] = useState<string | null>(null);
  const [previousPartnerId, setPreviousPartnerId] = useState<string | null>(null);
  const [showUndoBack, setShowUndoBack] = useState(false);
  const [localReaction, setLocalReaction] = useState<ReactionId | null>(null);
  const [inviteFromUserId, setInviteFromUserId] = useState<string | null>(null);
  const [inviteRoomId, setInviteRoomId] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [partnerVideoRevealed, setPartnerVideoRevealed] = useState(false);
  const [partnerVideoCountdown, setPartnerVideoCountdown] = useState<number | null>(null);
  const [videoTransitionOut, setVideoTransitionOut] = useState(false);
  const [battery, setBattery] = useState(100);
  const [isVipSubscriber, setIsVipSubscriber] = useState(false);
  const [batteryDepletedModalVisible, setBatteryDepletedModalVisible] = useState(false);
  const [batteryChargeLoading, setBatteryChargeLoading] = useState(false);
  const [batteryLoading, setBatteryLoading] = useState(!!userId);
  const [zeroDrainUntil, setZeroDrainUntil] = useState<number>(0);
  const [matchFilter, setMatchFilter] = useState<MatchFilter>("everyone");
  /** ISO2 target for peer's User.country (IP/profile); null = no filter */
  const [matchTargetCountry, setMatchTargetCountry] = useState<string | null>(null);
  const [partnerIsPremium, setPartnerIsPremium] = useState(false);
  const [showBioCard, setShowBioCard] = useState(true);
  const [ghostModeChargedAt, setGhostModeChargedAt] = useState<number>(0);
  const [sessionSummaryVisible, setSessionSummaryVisible] = useState(false);
  const [giftsReceivedCount, setGiftsReceivedCount] = useState(0);
  const [commonInterestFlash, setCommonInterestFlash] = useState<string | null>(null);
  const [showPartnerSkeleton, setShowPartnerSkeleton] = useState(false);
  const [partnerCountryCode, setPartnerCountryCode] = useState<string | null>(null);
  const [quickChatDraft, setQuickChatDraft] = useState("");
  const prevPartnerIdRef = useRef<string | null>(null);
  const [shadowBanned, setShadowBanned] = useState(false);
  const [moderationViolationVisible, setModerationViolationVisible] = useState(false);
  const { socket, connected: socketConnected } = useSocketContext();
  const pendingInviteRoomIdRef = useRef<string | null>(null);
  const beautyBlurIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { reaction: incomingReaction, clearReaction } = useReactions(userId ?? null);
  const { leaderboard, top1UserId } = useLeaderboard();
  const {
    streak: dailyStreak,
    claimedToday: dailyClaimedToday,
    goldBadge: dailyGoldBadge,
    loading: dailyRewardLoading,
    claim: claimDailyReward,
  } = useDailyReward(!!userId);
  const liveTranslationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const coinsRef = useRef(coins);
  coinsRef.current = coins;
  const hasNoAdsPass = false; // TODO: verifica din backend – Gender Pass, Full Pass sau Full Month (orice pass fără reclame)
  const countdownSentRef = useRef<Set<number>>(new Set());
  const guestNextClicksRef = useRef(0);
  const nextSoundRef = useRef<HTMLAudioElement | null>(null);
  const undoBackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectionStartedAtRef = useRef<number>(0);
  const batteryRef = useRef(battery);
  batteryRef.current = battery;
  const hasPlayedLowBatteryRef = useRef(false);
  const t = getContentT(locale);

  const refreshTranslationStatus = useCallback(async () => {
    if (!userId) return;
    try {
      const r = await fetch("/api/translation/status", { credentials: "include" });
      if (!r.ok) return;
      const d = (await r.json()) as {
        unlimited?: boolean;
        remainingMinutes?: number;
      };
      const unlimited = !!d.unlimited;
      setTranslationUnlimited(unlimited);
      if (unlimited) {
        setTranslationRemainSec(null);
        translationRemainSecRef.current = 0;
      } else {
        const sec = Math.max(0, Math.floor((d.remainingMinutes ?? 0) * 60));
        setTranslationRemainSec(sec);
        translationRemainSecRef.current = sec;
      }
    } catch {
      /* ignore */
    }
  }, [userId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setTranslateTargetCode(getStoredTranslationTargetCode(locale === "ro" ? "ro" : "en"));
  }, [locale]);

  useEffect(() => {
    void refreshTranslationStatus();
  }, [refreshTranslationStatus]);

  useEffect(() => {
    translationRemainSecRef.current = translationRemainSec ?? 0;
  }, [translationRemainSec]);

  useEffect(() => {
    if (!liveTranslationEnabled || !userId || translationUnlimited) return;
    const id = window.setInterval(() => {
      translationRemainSecRef.current = Math.max(0, translationRemainSecRef.current - 1);
      setTranslationRemainSec(translationRemainSecRef.current);
    }, 1000);
    return () => clearInterval(id);
  }, [liveTranslationEnabled, userId, translationUnlimited]);

  const requireAuth = useCallback(() => {
    if (isGuest && onRequireAuth) {
      onRequireAuth();
      return true;
    }
    return false;
  }, [isGuest, onRequireAuth]);

  useEffect(() => {
    if (partnerId && partnerId !== prevPartnerIdRef.current) {
      prevPartnerIdRef.current = partnerId;
      setPartnerCountryCode(pickRandomDemoCountry());
    }
    if (!partnerId) {
      prevPartnerIdRef.current = null;
      setPartnerCountryCode(null);
    }
  }, [partnerId]);

  // ─── Handlers (useCallback) – toate la început, înainte de useEffect ───
  const handleInstantReveal = useCallback(async () => {
    if (requireAuth()) return;
    if (coinsRef.current < INSTANT_REVEAL_COST && !onSpend) {
      onOpenShop();
      return;
    }
    if (onSpend) {
      const ok = await onSpend(INSTANT_REVEAL_COST, "instant_reveal");
      if (ok) {
        setPartnerVideoRevealed(true);
        setPartnerVideoCountdown(null);
        await onWalletRefetch?.();
      }
    } else {
      setCoins((c) => c - INSTANT_REVEAL_COST);
      setPartnerVideoRevealed(true);
      setPartnerVideoCountdown(null);
    }
  }, [onSpend, setCoins, onWalletRefetch, onOpenShop, requireAuth]);

  const handleQuickCharge = useCallback(async () => {
    if (coinsRef.current < BATTERY_QUICK_CHARGE_COST && !onSpend) {
      onOpenShop();
      return;
    }
    setBatteryChargeLoading(true);
    try {
      if (userId && onSpend) {
        const res = await fetch("/api/battery/charge", { method: "POST" });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data?.battery != null) {
          setBattery(data.battery);
          setBatteryDepletedModalVisible(false);
          await onWalletRefetch?.();
          feedbackSuccess();
        } else if (res.status === 400) {
          onOpenShop();
        }
      } else {
        setCoins((c) => c - BATTERY_QUICK_CHARGE_COST);
        const next = Math.min(100, battery + BATTERY_QUICK_CHARGE_AMOUNT);
        setBattery(next);
        setStoredGuestBattery(next);
        setBatteryDepletedModalVisible(false);
        feedbackSuccess();
      }
    } finally {
      setBatteryChargeLoading(false);
    }
  }, [userId, onSpend, setCoins, onWalletRefetch, onOpenShop, battery]);

  const handleLiveTranslationInsufficientBalance = useCallback(() => {
    setLiveTranslationEnabled(false);
    toast(t.needCoinsMessage, { icon: "💎" });
    onOpenShop();
  }, [t.needCoinsMessage, onOpenShop]);

  const handleStartOrNext = useCallback(async () => {
    if (isGuest) {
      guestNextClicksRef.current += 1;
      if (guestNextClicksRef.current > 3) {
        onGuestPaywallTrigger?.("next_limit");
        return;
      }
    }
    if (videoTransitionOut) return;
    setVideoTransitionOut(true);
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 200);
    });
    setVideoTransitionOut(false);
    feedbackClick();
    playWhooshSound();
    nextSoundRef.current?.play().catch(() => {});

    if (ensureFilterAccess && (premiumSecondsLeft ?? 0) > 0) {
      const ok = await ensureFilterAccess("gender");
      if (!ok) return;
    }

    if (connected) {
      if (useRealMatching && partnerId) {
        setPreviousPartnerId(partnerId);
        setShowUndoBack(true);
        if (undoBackTimeoutRef.current) clearTimeout(undoBackTimeoutRef.current);
        undoBackTimeoutRef.current = setTimeout(() => {
          setShowUndoBack(false);
          setPreviousPartnerId(null);
          undoBackTimeoutRef.current = null;
        }, 5000);
      }
      const count = nextCount + 1;
      setNextCount(count);
      if (count >= 10) {
        setNextCount(0);
        if (hasNoAdsPass) {
          setShowVideoAd(true);
        } else {
          setShowGenderFilterCTA(true);
        }
      }
    }
    if (onMissionIncrement) {
      const connectionDurationMs = Date.now() - connectionStartedAtRef.current;
      const result = await onMissionIncrement(connectionDurationMs);
      if (result?.justCompleted) {
        feedbackSuccess();
      }
    } else if (!dailyQuestCompleted && dailyQuestCount < DAILY_GOAL) {
      const next = dailyQuestCount + 1;
      setDailyQuestCount(next);
      if (next >= DAILY_GOAL) {
        setDailyQuestCompleted(true);
        if (onAddCoins) {
          onAddCoins(DAILY_REWARD_COINS);
        } else {
          setCoins((c) => c + DAILY_REWARD_COINS);
        }
        setDailyQuestProgress(DAILY_GOAL, true);
        feedbackSuccess();
      } else {
        setDailyQuestProgress(next, false);
      }
    }
    setSearching(true);
    setConnected(false);
    setGhostMode(false);
    setLiveTranslationEnabled(false);
    setPartnerId(null);
    setPartnerNickname(null);
    setPartnerIsPremium(false);
    setShowBioCard(true);

    if (useRealMatching) {
      (async () => {
        await fetch("/api/match/leave", { method: "POST" }).catch(() => {});
        const res = await fetch("/api/match/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filter: matchFilter,
            ...(matchTargetCountry ? { targetCountryCode: matchTargetCountry } : {}),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 403) {
          setSearching(false);
          toast.error(data?.error ?? "Your account is temporarily restricted. Please try again later.");
          return;
        }
        if (res.status === 400 && data?.code === "INSUFFICIENT_COINS_COUNTRY_MATCH") {
          setSearching(false);
          toast.error(data?.error ?? t.insufficientCoinsCountryMatch);
          onOpenShop();
          return;
        }
        if (res.status === 429) {
          setSearching(false);
          toast.error(data?.error ?? "Too many requests. Please wait before clicking Next again.");
          return;
        }
        if (data.status === "matched") {
          setSearching(false);
          setConnected(true);
          if (data.partnerId) {
            setPartnerId(data.partnerId);
            setPartnerNickname(
              typeof data.partnerNickname === "string" ? data.partnerNickname : null
            );
          }
          void onWalletRefetch?.();
          return;
        }
        const start = Date.now();
        const poll = async () => {
          if (Date.now() - start > MATCH_TIMEOUT_MS) {
            setSearching(false);
            setConnected(true);
            return;
          }
          const s = await fetch("/api/match/status");
          const d = await s.json().catch(() => ({}));
          if (d.status === "matched") {
            setSearching(false);
            setConnected(true);
            if (d.partnerId) {
              setPartnerId(d.partnerId);
              setPartnerNickname(
                typeof d.partnerNickname === "string" ? d.partnerNickname : null
              );
            }
            void onWalletRefetch?.();
            return;
          }
          setTimeout(poll, MATCH_POLL_MS);
        };
        setTimeout(poll, MATCH_POLL_MS);
      })();
      return;
    }

    const timeout = setTimeout(() => {
      setSearching(false);
      setConnected(true);
    }, 2000 + Math.random() * 2000);
    return () => clearTimeout(timeout);
  }, [
    connected,
    nextCount,
    dailyQuestCompleted,
    dailyQuestCount,
    setCoins,
    onAddCoins,
    ensureFilterAccess,
    premiumSecondsLeft,
    onMissionIncrement,
    useRealMatching,
    partnerId,
    matchFilter,
    matchTargetCountry,
    isGuest,
    videoTransitionOut,
    onGuestPaywallTrigger,
    onWalletRefetch,
    onOpenShop,
    t.insufficientCoinsCountryMatch,
  ]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "ArrowRight") return;
      if (e.repeat) return;
      if (typeof window === "undefined") return;
      if (window.innerWidth < NEXT_KEY_DESKTOP_MIN_WIDTH_PX) return;
      if (isKeyboardTypingTarget(e.target)) return;
      if (battery === 0) return;
      e.preventDefault();
      void handleStartOrNext();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleStartOrNext, battery]);

  const handleUndoNext = useCallback(async () => {
    if (requireAuth()) return;
    if (!previousPartnerId || coins < UNDO_NEXT_COST) {
      if (coins < UNDO_NEXT_COST) onOpenShop();
      return;
    }
    if (!onSpend) return;
    feedbackClick();
    if (undoBackTimeoutRef.current) {
      clearTimeout(undoBackTimeoutRef.current);
      undoBackTimeoutRef.current = null;
    }
    setShowUndoBack(false);
    try {
      const res = await fetch("/api/match/undo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerId: previousPartnerId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.status === "matched") {
        setPreviousPartnerId(null);
        setSearching(false);
        setConnected(true);
        if (data.partnerId) {
          setPartnerId(data.partnerId);
          setPartnerNickname(
            typeof data.partnerNickname === "string" ? data.partnerNickname : null
          );
        }
        await onWalletRefetch?.();
        feedbackSuccess();
        return;
      }
      if (data.status === "waiting") {
        const start = Date.now();
        const poll = async () => {
          if (Date.now() - start > MATCH_TIMEOUT_MS) {
            setPreviousPartnerId(null);
            return;
          }
          const s = await fetch("/api/match/status");
          const d = await s.json().catch(() => ({}));
          if (d.status === "matched") {
            setPreviousPartnerId(null);
            setSearching(false);
            setConnected(true);
            if (d.partnerId) {
              setPartnerId(d.partnerId);
              setPartnerNickname(
                typeof d.partnerNickname === "string" ? d.partnerNickname : null
              );
            }
            await onWalletRefetch?.();
            feedbackSuccess();
            return;
          }
          setTimeout(poll, MATCH_POLL_MS);
        };
        setTimeout(poll, MATCH_POLL_MS);
      } else {
        setPreviousPartnerId(null);
      }
    } catch {
      setPreviousPartnerId(null);
    }
  }, [previousPartnerId, coins, onSpend, onWalletRefetch, onOpenShop, requireAuth]);

  const handleSelectFilter = useCallback(
    (filter: VideoFilterId) => {
    if (filter !== "none" && requireAuth()) return;
    if (filter === "beauty_blur") {
      setBeautyBlurFreeSecondsLeft(BEAUTY_BLUR_FREE_SEC);
      setBeautyBlurPaid(false);
      setBeautyBlurOverlayVisible(false);
    } else {
      setBeautyBlurPaid(false);
      setBeautyBlurOverlayVisible(false);
    }
    setActiveFilter(filter);
  },
    [requireAuth]
  );

  const handleBeautyBlurActivate = useCallback(async () => {
    if (requireAuth()) return;
    if (coinsRef.current < BEAUTY_BLUR_COST_PER_MIN && !onSpend) return;
    setBeautyBlurLoading(true);
    if (onSpend) {
      const ok = await onSpend(BEAUTY_BLUR_COST_PER_MIN, "beauty_blur_filter");
      setBeautyBlurLoading(false);
      if (ok) {
        setBeautyBlurPaid(true);
        setBeautyBlurOverlayVisible(false);
      }
    } else {
      setCoins((c) => c - BEAUTY_BLUR_COST_PER_MIN);
      setBeautyBlurLoading(false);
      setBeautyBlurPaid(true);
      setBeautyBlurOverlayVisible(false);
    }
  }, [onSpend, setCoins, requireAuth]);

  const handleBeautyBlurRemove = useCallback(() => {
    setActiveFilter("none");
    setBeautyBlurPaid(false);
    setBeautyBlurOverlayVisible(false);
  }, []);

  const handleLiveTranslationToggle = useCallback(async () => {
    if (liveTranslationEnabled) {
      setLiveTranslationEnabled(false);
      return;
    }
    if (requireAuth()) return;
    if (userId && onSpend) {
      await refreshTranslationStatus();
      try {
        const r = await fetch("/api/translation/status", { credentials: "include" });
        const d = (await r.json()) as {
          unlimited?: boolean;
          remainingMinutes?: number;
        };
        if (!r.ok) {
          toast.error("Could not load translation quota");
          return;
        }
        if (!d.unlimited && (d.remainingMinutes ?? 0) <= 0) {
          toast("Daily AI translation limit reached — try again tomorrow.", {
            icon: "🤖",
            duration: 5000,
          });
          return;
        }
        setTranslationUnlimited(!!d.unlimited);
        if (d.unlimited) {
          setTranslationRemainSec(null);
        } else {
          const sec = Math.max(0, Math.floor((d.remainingMinutes ?? 0) * 60));
          setTranslationRemainSec(sec);
          translationRemainSecRef.current = sec;
        }
      } catch {
        toast.error("Network error");
        return;
      }
      setLiveTranslationEnabled(true);
      feedbackSuccess();
      return;
    }
    if (coinsRef.current < LIVE_TRANSLATION_COST_PER_MIN && !onSpend) {
      toast(t.needCoinsMessage, { icon: "💎" });
      onOpenShop();
      return;
    }
    setLiveTranslationEnabled(true);
    feedbackSuccess();
  }, [
    liveTranslationEnabled,
    t.needCoinsMessage,
    onOpenShop,
    onSpend,
    requireAuth,
    userId,
    refreshTranslationStatus,
  ]);

  const handleSendReaction = useCallback(
    async (reactionId: ReactionId) => {
      const cost = getReactionCost(reactionId);
      if (coinsRef.current < cost && !onSpend) {
        toast(t.needCoinsMessage, { icon: "💎" });
        onOpenShop();
        return;
      }

      const toUser = partnerId || userId || "self";
      if (onSpend && userId) {
        const res = await fetch("/api/reactions/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toUserId: toUser, reactionType: reactionId }),
        });
        if (res.ok) {
          await onWalletRefetch?.();
          feedbackSuccess();
        }
      } else {
        setCoins((c) => c - cost);
        setLocalReaction(reactionId);
        feedbackSuccess();
      }
    },
    [partnerId, userId, onSpend, setCoins, onWalletRefetch, t.needCoinsMessage, onOpenShop]
  );

  const handleReactionOverlayComplete = useCallback(() => {
    clearReaction();
    setLocalReaction(null);
  }, [clearReaction]);

  const handleGhostModeToggle = useCallback(async () => {
    if (ghostMode) {
      setGhostMode(false);
      return;
    }
    if (requireAuth()) return;
    if (coinsRef.current < GHOST_MODE_COST_PER_2MIN && !onSpend) {
      toast(t.needCoinsMessage, { icon: "💎" });
      onOpenShop();
      return;
    }
    if (onSpend) {
      const ok = await onSpend(GHOST_MODE_COST_PER_2MIN, "ghost_mode");
      if (ok) {
        setGhostMode(true);
        setGhostModeChargedAt(Date.now());
        feedbackSuccess();
      }
    } else {
      setCoins((c) => c - GHOST_MODE_COST_PER_2MIN);
      setGhostMode(true);
      setGhostModeChargedAt(Date.now());
      feedbackSuccess();
    }
  }, [ghostMode, onSpend, setCoins, t.needCoinsMessage, onOpenShop, requireAuth]);

  // Ghost Mode: charge 1 coin every 2 minutes
  useEffect(() => {
    if (!ghostMode || !connected || searching) return;
    const tid = setInterval(async () => {
      const elapsed = Date.now() - ghostModeChargedAt;
      if (elapsed < GHOST_MODE_INTERVAL_MS) return;
      if (coinsRef.current < GHOST_MODE_COST_PER_2MIN && !onSpend) {
        setGhostMode(false);
        toast("Ghost Mode ended – insufficient balance", { icon: "👻" });
        onOpenShop();
        return;
      }
      if (onSpend) {
        const ok = await onSpend(GHOST_MODE_COST_PER_2MIN, "ghost_mode");
        if (ok) {
          setGhostModeChargedAt(Date.now());
          await onWalletRefetch?.();
        } else {
          setGhostMode(false);
        }
      } else {
        setCoins((c) => c - GHOST_MODE_COST_PER_2MIN);
        setGhostModeChargedAt(Date.now());
      }
    }, 30000);
    return () => clearInterval(tid);
  }, [ghostMode, connected, searching, ghostModeChargedAt, onSpend, setCoins, onOpenShop, onWalletRefetch]);

  const handleInvite = useCallback(() => {
    if (requireAuth()) return;
    if (!socket || !partnerId || !useRealMatching || inviteLoading) return;
    if (coinsRef.current < PRIVATE_ROOM_COST_PER_MIN && !onSpend) {
      onOpenShop();
      return;
    }
    const roomId = crypto.randomUUID();
    pendingInviteRoomIdRef.current = roomId;
    socket.emit("private_invite", { toUserId: partnerId, roomId });
    feedbackSuccess();
  }, [socket, partnerId, useRealMatching, inviteLoading, onSpend, onOpenShop, requireAuth]);

  const handleAcceptInvite = useCallback(() => {
    if (!socket || !inviteFromUserId || !inviteRoomId) return;
    socket.emit("private_accept", {
      roomId: inviteRoomId,
      fromUserId: inviteFromUserId,
    });
    setInviteFromUserId(null);
    setInviteRoomId(null);
    feedbackSuccess();
  }, [socket, inviteFromUserId, inviteRoomId]);

  const handleDeclineInvite = useCallback(() => {
    if (socket && inviteFromUserId && inviteRoomId) {
      socket.emit("private_decline", {
        roomId: inviteRoomId,
        fromUserId: inviteFromUserId,
      });
    }
    setInviteFromUserId(null);
    setInviteRoomId(null);
  }, [socket, inviteFromUserId, inviteRoomId]);

  const handleStop = useCallback(() => {
    if (connected) {
      setSessionSummaryVisible(true);
    } else {
      setConnected(false);
      setSearching(true);
      if (useRealMatching) {
        fetch("/api/match/leave", { method: "POST" }).catch(() => {});
      }
    }
  }, [connected, useRealMatching]);

  const handleReport = useCallback(async () => {
    if (!partnerId) return;
    try {
      await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportedUserId: partnerId }),
      });
      toast.success("Report submitted. Thank you for helping keep our community safe.");
    } catch {
      toast.error("Could not submit report. Please try again.");
    }
  }, [partnerId]);

  const handleSessionSummaryClose = useCallback(() => {
    setSessionSummaryVisible(false);
    setConnected(false);
    setSearching(true);
    setPartnerId(null);
    setPartnerNickname(null);
    if (useRealMatching) {
      fetch("/api/match/leave", { method: "POST" }).catch(() => {});
    }
  }, [useRealMatching]);

  const handleQuickChatSend = useCallback(() => {
    if (!quickChatDraft.trim()) return;
    if (isGuest) {
      onGuestPaywallTrigger?.("chat");
      return;
    }
    toast("Use the Pulse chat panel to send messages.");
    setQuickChatDraft("");
  }, [quickChatDraft, isGuest, onGuestPaywallTrigger]);

  const handleModerationViolation = useCallback(() => {
    setModerationViolationVisible(true);
    setConnected(false);
    setSearching(true);
    setPartnerId(null);
    setPartnerNickname(null);
    if (useRealMatching) {
      fetch("/api/match/leave", { method: "POST" }).catch(() => {});
    }
    toast.error("Violation detected. Your account is flagged.");
  }, [useRealMatching]);

  const handleSendGift = useCallback(
    async (giftId: TheaterGiftId) => {
      if (isGuest) {
        onGuestPaywallTrigger?.("gift");
        return;
      }
      const cost = getTheaterGiftCost(giftId);
      if (!canAffordTheaterGift(coins, giftId)) {
        toast(t.needCoinsMessage, { icon: "💎" });
        onOpenShop();
        return;
      }

      if (onSpend) {
        const ok = await onSpend(cost, "gift");
        if (!ok) return;
      } else {
        setCoins((c) => c - cost);
      }
      const sender = viewerDisplayName?.trim() || "You";
      const giftLabel =
        giftId === "fire"
          ? "Fire"
          : giftId === "rocket"
            ? "Rocket"
            : getGiftName(giftId as GiftId, locale);

      if (giftId === "fire" || giftId === "rocket") {
        if (partnerId && socket && socketConnected) {
          socket.emit("theater_gift_overlay", {
            toUserId: partnerId,
            giftType: giftId,
            senderLabel: sender,
            giftLabel,
          });
        }
      } else {
        setActiveGift({
          giftId: giftId as GiftId,
          receivedAt: Date.now(),
          senderLabel: sender,
          giftLabel,
        });
      }

      setTopSupportersRefreshKey((k) => k + 1);
      playGiftSound();
      if (cost >= 10 && typeof navigator !== "undefined" && "vibrate" in navigator) {
        triggerPremiumGiftHaptic();
      }
      const giftName =
        giftId === "fire"
          ? "Fire"
          : giftId === "rocket"
            ? "Rocket"
            : getGiftName(giftId as GiftId, locale);
      toast(t.giftSentToast.replace("{{giftName}}", giftName));
    },
    [
      coins,
      t.needCoinsMessage,
      t.giftSentToast,
      setCoins,
      onOpenShop,
      onSpend,
      locale,
      isGuest,
      onGuestPaywallTrigger,
      viewerDisplayName,
      partnerId,
      socket,
      socketConnected,
    ]
  );

  const handleGiftComplete = useCallback(() => {
    setActiveGift(null);
  }, []);

  const handlePartnerVideoGiftComplete = useCallback(() => {
    setPartnerVideoGift(null);
  }, []);

  useEffect(() => {
    if (!connected || !partnerId || searching) {
      setPartnerVideoGift(null);
    }
  }, [connected, partnerId, searching]);

  useEffect(() => {
    if (!socket || !partnerId) return;
    const onTheaterGiftOverlay = (payload: {
      giftType?: string;
      fromUserId?: string | null;
      senderLabel?: string;
      giftLabel?: string;
    }) => {
      if (!payload.fromUserId || payload.fromUserId !== partnerId) return;
      if (payload.giftType !== "fire" && payload.giftType !== "rocket") return;
      setPartnerVideoGift({
        giftType: payload.giftType,
        receivedAt: Date.now(),
        senderLabel: payload.senderLabel,
        giftLabel: payload.giftLabel,
      });
    };
    socket.on("theater_gift_overlay", onTheaterGiftOverlay);
    return () => {
      socket.off("theater_gift_overlay", onTheaterGiftOverlay);
    };
  }, [socket, partnerId]);

  // ─── useEffect hooks ───
  useEffect(() => {
    if (connected) connectionStartedAtRef.current = Date.now();
  }, [connected]);

  // Match celebration: neon confetti burst
  const celebratedMatchRef = useRef<string | null>(null);
  useEffect(() => {
    if (!connected || !partnerId || searching) return;
    if (celebratedMatchRef.current === partnerId) return;
    celebratedMatchRef.current = partnerId;
    withConfetti((c) => {
      const fire = (opts: Pick<Options, "origin" | "colors" | "spread">) =>
        void c({ ...opts, particleCount: 40, scalar: 0.8, ticks: 120 });
      fire({ origin: { x: 0.25, y: 0.5 }, colors: ["#8b5cf6", "#a78bfa", "#39ff14"], spread: 55 });
      fire({ origin: { x: 0.75, y: 0.5 }, colors: ["#8b5cf6", "#a78bfa", "#39ff14"], spread: 55 });
    });
  }, [connected, partnerId, searching]);

  // Common interests flash when matched
  useEffect(() => {
    if (!connected || !partnerId || searching) return;
    const interests = ["Both love Techno Music!", "Both are from London!", "Both love Coffee!", "Both love Travel!"];
    setCommonInterestFlash(interests[Math.floor(Math.random() * interests.length)]);
    const t = setTimeout(() => setCommonInterestFlash(null), 4000);
    return () => clearTimeout(t);
  }, [connected, partnerId, searching]);

  // Partner video: Premium = instant clear; non-Premium = 0.5s blurred teaser
  useEffect(() => {
    if (!connected || searching) {
      setPartnerVideoRevealed(false);
      setPartnerVideoCountdown(null);
      return;
    }
    if (isVipSubscriber) {
      setPartnerVideoRevealed(true);
      setPartnerVideoCountdown(null);
      return;
    }
    setPartnerVideoRevealed(false);
    setPartnerVideoCountdown(null);
    const tid = setTimeout(() => {
      setPartnerVideoRevealed(true);
    }, 500);
    return () => clearTimeout(tid);
  }, [connected, searching, isVipSubscriber]);

  useEffect(() => {
    return () => {
      if (undoBackTimeoutRef.current) {
        clearTimeout(undoBackTimeoutRef.current);
        undoBackTimeoutRef.current = null;
      }
    };
  }, []);

  // Battery: fetch initial level (auth: API, guest: localStorage)
  useEffect(() => {
    if (userId) {
      setBatteryLoading(true);
      fetch("/api/battery")
        .then((res) => res.json())
        .then((data) => {
          if (data?.battery != null) setBattery(Math.max(0, Math.min(100, data.battery)));
          if (data?.isVip != null) setIsVipSubscriber(data.isVip);
        })
        .catch(() => {})
        .finally(() => setBatteryLoading(false));
    } else {
      setBattery(getStoredGuestBattery());
      setIsVipSubscriber(false);
      setBatteryLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    onBatteryDisplayChange?.({ percent: battery, loading: batteryLoading });
  }, [battery, batteryLoading, onBatteryDisplayChange]);

  // Daily reward: claim on mount (first login of day = +5% battery)
  const hasClaimedDailyRef = useRef(false);
  useEffect(() => {
    if (!userId || hasClaimedDailyRef.current) return;
    hasClaimedDailyRef.current = true;
    claimDailyReward().then((data) => {
      if (data?.claimed && data.battery != null) {
        setBattery(Math.max(0, Math.min(100, data.battery)));
        toast.success(t.dailyRewardBattery + "!");
      }
    });
  }, [userId, claimDailyReward, t.dailyRewardBattery]);

  // Battery: show depleted modal when hitting 0%; hide when disconnecting
  useEffect(() => {
    if (battery === 0) {
      setBatteryDepletedModalVisible(true);
    } else if (!connected || searching) {
      setBatteryDepletedModalVisible(false);
    }
  }, [battery, connected, searching]);

  // Low Battery event: ensure modal shown when heartbeat reports depleted (blocks video stream)
  useEffect(() => {
    const onLowBattery = () => setBatteryDepletedModalVisible(true);
    window.addEventListener("low-battery", onLowBattery);
    return () => window.removeEventListener("low-battery", onLowBattery);
  }, []);

  // Battery: low segment (<25%) – sunet + toast o singură dată la intrare în zonă
  useEffect(() => {
    if (battery >= 25) {
      hasPlayedLowBatteryRef.current = false;
      return;
    }
    if (battery > 0 && !hasPlayedLowBatteryRef.current) {
      hasPlayedLowBatteryRef.current = true;
      playLowBatterySound();
      toast(t.batteryLowToast);
    }
  }, [battery, t.batteryLowToast]);

  // Battery: heartbeat 60s (120s VIP); -3% per tick (~25% / ~8–9 min)
  const isZeroDrainActive = zeroDrainUntil > Date.now();
  useEffect(() => {
    if (!connected || searching) return;
    const intervalMs = isVipSubscriber ? BATTERY_DRAIN_VIP_MS : BATTERY_DRAIN_MS;
    const drainAmount = BATTERY_HEARTBEAT_DRAIN;
    const tid = setInterval(async () => {
      if (zeroDrainUntil > Date.now()) return;
      if (batteryRef.current <= 0) return;
      if (userId) {
        const res = await fetch("/api/battery/heartbeat", { method: "POST" });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data?.battery != null) {
          const next = Math.max(0, data.battery);
          setBattery(next);
          if (data.depleted || next <= 0) {
            window.dispatchEvent(new CustomEvent("low-battery"));
          }
        }
      } else {
        setBattery((prev) => {
          const next = Math.max(0, prev - drainAmount);
          setStoredGuestBattery(next);
          if (next <= 0) {
            window.dispatchEvent(new CustomEvent("low-battery"));
          }
          return next;
        });
      }
    }, intervalMs);
    return () => clearInterval(tid);
  }, [connected, searching, userId, isVipSubscriber, zeroDrainUntil]);

  // Socket: private invite flow
  useEffect(() => {
    if (!socket) return;

    const onInvite = (data: { fromUserId: string; roomId: string }) => {
      setInviteFromUserId(data.fromUserId);
      setInviteRoomId(data.roomId);
    };

    const onRoomReady = async (data: { roomId: string }) => {
      if (!onNavigateToPrivate) return;
      const isHost = pendingInviteRoomIdRef.current === data.roomId;
      if (isHost && userId && partnerId) {
        setInviteLoading(true);
        try {
          const res = await fetch("/api/private/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              guestUserId: partnerId,
              roomId: data.roomId,
            }),
          });
          if (res.ok) {
            await onWalletRefetch?.();
            onNavigateToPrivate(data.roomId);
          }
        } finally {
          setInviteLoading(false);
          pendingInviteRoomIdRef.current = null;
        }
      } else {
        onNavigateToPrivate(data.roomId);
        setInviteFromUserId(null);
        setInviteRoomId(null);
      }
    };

    const onPartnerIsPremium = () => setPartnerIsPremium(true);

    socket.on("private_invite", onInvite);
    socket.on("private_room_ready", onRoomReady);
    socket.on("partner_is_premium", onPartnerIsPremium);

    return () => {
      socket.off("private_invite", onInvite);
      socket.off("private_room_ready", onRoomReady);
      socket.off("partner_is_premium", onPartnerIsPremium);
    };
  }, [socket, userId, partnerId, onNavigateToPrivate, onWalletRefetch]);

  // Spending Tiers: reset when partner changes; notify partner when Whale enters chat
  useEffect(() => {
    setPartnerIsPremium(false);
  }, [partnerId]);

  // Skeleton loader during partner video transitions (eliminate black screens)
  useEffect(() => {
    if (!connected || !partnerId || searching) return;
    setShowPartnerSkeleton(true);
    const t = setTimeout(() => setShowPartnerSkeleton(false), 800);
    return () => clearTimeout(t);
  }, [connected, partnerId, searching]);

  // Shadow ban check (3 reports in 10 min → 30 min ban)
  useEffect(() => {
    setShadowBanned(isShadowBanned());
  }, []);

  // Video moderation: capture local stream every 30s, check for nudity/weapons
  useVideoModeration({
    enabled: connected && !searching && !!userId,
    userId,
    partnerId,
    onViolation: handleModerationViolation,
  });

  // Face detection: if no face for 1 min, auto-disconnect (saves bandwidth).
  // TODO: Integrate @mediapipe/face_detection or similar; run on partner video stream.
  // For now, placeholder - real implementation would analyze video frames and call handleStop when no face for 60s.

  useEffect(() => {
    if (!socket || !partnerId || !isWhale || !useRealMatching) return;
    socket.emit("whale_entered_chat", { toUserId: partnerId });
  }, [socket, partnerId, isWhale, useRealMatching]);

  useEffect(() => {
    if (onMissionIncrement) return;
    const { count, completed } = getDailyQuestProgress();
    setDailyQuestCount(count);
    setDailyQuestCompleted(completed);
  }, [onMissionIncrement]);

  // Initial match: real API (priority queue) or simulated delay
  useEffect(() => {
    if (!useRealMatching) {
      const id = setTimeout(() => {
        setSearching(false);
        setConnected(true);
      }, 2500);
      return () => clearTimeout(id);
    }

    let cancelled = false;
    const pollUntilMatch = async () => {
      const res = await fetch("/api/match/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filter: matchFilter,
          ...(matchTargetCountry ? { targetCountryCode: matchTargetCountry } : {}),
        }),
      });
      if (cancelled) return;
      const data = await res.json().catch(() => ({}));
      if (res.status === 403) {
        setSearching(false);
        toast.error(data?.error ?? "Your account is temporarily restricted. Please try again later.");
        return;
      }
      if (res.status === 400 && data?.code === "INSUFFICIENT_COINS_COUNTRY_MATCH") {
        setSearching(false);
        toast.error(data?.error ?? t.insufficientCoinsCountryMatch);
        onOpenShop();
        return;
      }
      if (res.status === 429) {
        setSearching(false);
        toast.error(data?.error ?? "Too many requests. Please wait before clicking Next again.");
        return;
      }
      if (data.status === "matched") {
        setSearching(false);
        setConnected(true);
        if (data.partnerId) {
          setPartnerId(data.partnerId);
          setPartnerNickname(
            typeof data.partnerNickname === "string" ? data.partnerNickname : null
          );
        }
        void onWalletRefetch?.();
        return;
      }
      const start = Date.now();
      const poll = async () => {
        if (cancelled) return;
        if (Date.now() - start > MATCH_TIMEOUT_MS) {
          setSearching(false);
          setConnected(true);
          return;
        }
        const s = await fetch("/api/match/status");
        if (cancelled) return;
        const d = await s.json().catch(() => ({}));
        if (d.status === "matched") {
          setSearching(false);
          setConnected(true);
          if (d.partnerId) {
            setPartnerId(d.partnerId);
            setPartnerNickname(
              typeof d.partnerNickname === "string" ? d.partnerNickname : null
            );
          }
          void onWalletRefetch?.();
          return;
        }
        setTimeout(poll, MATCH_POLL_MS);
      };
      setTimeout(poll, MATCH_POLL_MS);
    };
    pollUntilMatch();
    return () => {
      cancelled = true;
      if (useRealMatching) fetch("/api/match/leave", { method: "POST" }).catch(() => {});
    };
  }, [useRealMatching, matchFilter, matchTargetCountry, onWalletRefetch, onOpenShop, t.insufficientCoinsCountryMatch]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    nextSoundRef.current = new Audio("/sounds/next-woosh.mp3");
  }, []);

  // Beauty Blur: 30s free trial countdown
  useEffect(() => {
    if (activeFilter !== "beauty_blur" || beautyBlurPaid) return;
    const tid = setInterval(() => {
      setBeautyBlurFreeSecondsLeft((prev) => {
        if (prev <= 1) {
          setBeautyBlurOverlayVisible(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tid);
  }, [activeFilter, beautyBlurPaid]);

  // Beauty Blur: deduct 2 coins every minute when paid
  useEffect(() => {
    if (activeFilter !== "beauty_blur" || !beautyBlurPaid) return;
    const deduct = async () => {
      if (onSpend) {
        const ok = await onSpend(BEAUTY_BLUR_COST_PER_MIN, "beauty_blur_filter");
        if (!ok) {
          setBeautyBlurPaid(false);
          setBeautyBlurOverlayVisible(true);
        }
      } else if (coinsRef.current >= BEAUTY_BLUR_COST_PER_MIN) {
        setCoins((c) => c - BEAUTY_BLUR_COST_PER_MIN);
      } else {
        setBeautyBlurPaid(false);
        setBeautyBlurOverlayVisible(true);
      }
    };
    beautyBlurIntervalRef.current = setInterval(deduct, 60000);
    return () => {
      if (beautyBlurIntervalRef.current) {
        clearInterval(beautyBlurIntervalRef.current);
        beautyBlurIntervalRef.current = null;
      }
    };
  }, [activeFilter, beautyBlurPaid, onSpend, setCoins]);

  // Live translation: auth users consume daily minutes via API; guests pay coins per minute
  useEffect(() => {
    if (!liveTranslationEnabled || !connected) return;
    const deduct = async () => {
      if (userId && onSpend) {
        const res = await fetch("/api/translation/use", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ minutes: 1 }),
        });
        if (res.status === 403) {
          setLiveTranslationEnabled(false);
          toast("Translation limit reached — try again later.", { icon: "🤖", duration: 5000 });
          return;
        }
        if (res.ok) {
          const j = (await res.json()) as { status?: { remainingMinutes?: number; unlimited?: boolean } };
          const st = j.status;
          if (st?.unlimited) {
            setTranslationUnlimited(true);
            setTranslationRemainSec(null);
          } else if (st && typeof st.remainingMinutes === "number") {
            const sec = Math.max(0, Math.floor(st.remainingMinutes * 60));
            setTranslationRemainSec(sec);
            translationRemainSecRef.current = sec;
          }
        }
        return;
      }
      if (onSpend) {
        const ok = await onSpend(LIVE_TRANSLATION_COST_PER_MIN, "live_translation");
        if (!ok) {
          setLiveTranslationEnabled(false);
          handleLiveTranslationInsufficientBalance();
        }
      } else if (coinsRef.current >= LIVE_TRANSLATION_COST_PER_MIN) {
        setCoins((c) => c - LIVE_TRANSLATION_COST_PER_MIN);
      } else {
        setLiveTranslationEnabled(false);
        handleLiveTranslationInsufficientBalance();
      }
    };
    liveTranslationIntervalRef.current = setInterval(deduct, 60000);
    return () => {
      if (liveTranslationIntervalRef.current) {
        clearInterval(liveTranslationIntervalRef.current);
        liveTranslationIntervalRef.current = null;
      }
    };
  }, [
    liveTranslationEnabled,
    connected,
    onSpend,
    setCoins,
    handleLiveTranslationInsufficientBalance,
    userId,
  ]);

  // Premium countdown: at 0 silent downgrade + blur (+ toast notice)
  useEffect(() => {
    if (premiumSecondsLeft === null || premiumSecondsLeft <= 0) return;
    const tid = setInterval(() => {
      setPremiumSecondsLeft((prev) => {
        if (prev === null || prev <= 0) return prev;
        const next = prev - 1;
        if (next === 0) {
          toast(t.systemFiltersExpired, { duration: 5000 });
          toast(t.systemConnectionDegraded, { duration: 5000 });
          setConnectionDegraded(true);
          return null;
        }
        // No 60s/30s countdown messages — progress bar only (relaxed psychology)
        return next;
      });
    }, 1000);
    return () => clearInterval(tid);
  }, [premiumSecondsLeft, t.systemFiltersExpired, t.systemConnectionDegraded]);

  const questCurrent = onMissionIncrement ? (missionCount ?? 0) : dailyQuestCount;
  const questCompleted = onMissionIncrement ? (missionCompleted ?? false) : dailyQuestCompleted;
  const mobileInCallMode = connected && !searching;
  const mobileTheaterChrome = mobileInCallMode && isMobile;

  const aiTranslationUi = useMemo(() => {
    if (!userId || isGuest) return null;
    return {
      active: liveTranslationEnabled,
      onToggle: () => void handleLiveTranslationToggle(),
      targetCode: translateTargetCode,
      onTargetChange: (code: string) => {
        setTranslateTargetCode(code);
        setStoredTranslationTargetCode(code);
      },
      remainingSeconds: translationRemainSec,
      unlimited: translationUnlimited,
      upgradeHint: false,
    };
  }, [
    userId,
    isGuest,
    liveTranslationEnabled,
    handleLiveTranslationToggle,
    translateTargetCode,
    translationRemainSec,
    translationUnlimited,
  ]);

  const liveKitRoomName = useMemo(() => {
    if (
      !useRealMatching ||
      !userId ||
      !partnerId ||
      !connected ||
      searching
    ) {
      return null;
    }
    return [userId, partnerId].sort().join("__");
  }, [useRealMatching, userId, partnerId, connected, searching]);

  const giftShopSharedProps = {
    locale,
    activeFilter,
    onSelectFilter: handleSelectFilter,
    connected,
    searching,
    ghostMode,
    onGhostModeToggle: handleGhostModeToggle,
    liveTranslationEnabled,
    onLiveTranslationToggle: handleLiveTranslationToggle,
    coins,
    onSendReaction: handleSendReaction,
    onSendGift: handleSendGift,
    onBeforeInteraction: isGuest ? undefined : requireAuth,
  };

  return (
    <section className="mt-0 flex h-full min-h-0 w-full max-w-full flex-col overflow-hidden bg-black max-md:max-w-[100vw] max-md:overflow-x-hidden">
      <div className="relative flex h-full min-h-0 w-full max-w-full flex-col gap-2 overflow-hidden xl:flex-row xl:items-stretch xl:gap-3">
        {/* Slim left rail — icon row below video on mobile, vertical rail on xl */}
        <div className="order-2 hidden w-full shrink-0 xl:order-1 xl:block xl:w-auto xl:overflow-visible">
          <StageLeftRail
            locale={locale}
            topSupportersRefreshKey={topSupportersRefreshKey}
            questCurrent={questCurrent}
            questCompleted={questCompleted}
            hasRewards={!!userId}
            questPanel={
              <DailyQuestPanel
                locale={locale}
                current={questCurrent}
                completed={questCompleted}
                taskType={missionTaskType}
              />
            }
            rewardsPanel={
              userId ? (
                dailyRewardLoading ? (
                  <div className="flex h-16 items-center justify-center rounded-xl border border-white/10 bg-black/20">
                    <span className="neon-spinner-sm" aria-hidden />
                  </div>
                ) : (
                  <DailyRewardCalendar
                    locale={locale}
                    streak={dailyStreak ?? 0}
                    claimedToday={dailyClaimedToday ?? false}
                    goldBadge={dailyGoldBadge ?? false}
                  />
                )
              ) : null
            }
          />
        </div>

        {/* Theater column: video-first on mobile, ~65–70vw stage on xl */}
        <div className="order-1 flex h-full min-h-0 min-w-0 w-full flex-1 flex-col gap-2 overflow-hidden xl:order-2 xl:min-w-0">
          <div className={`theater-stage theater-ambient-glow relative z-[1] mt-0 min-h-0 w-full min-w-0 flex-1 overflow-hidden rounded-2xl xl:mx-0 xl:mt-0 ${
            mobileTheaterChrome
              ? "fixed inset-0 z-[35] flex h-[100dvh] w-[100vw] max-w-[100vw] flex-col overflow-hidden overflow-x-hidden rounded-none"
              : ""
          }`}>
              {searching && (
                <div className="pointer-events-none absolute inset-x-0 top-2 z-[34] flex justify-center gap-2 px-3 max-md:top-3 md:hidden">
                  <NeonLiveLogo
                    variant="compact"
                    as="span"
                    className="scale-[0.8] opacity-85"
                  />
                  <span className="number-plain text-[11px] font-medium tracking-wide text-[var(--color-text-secondary)]">
                    1,660 online
                  </span>
                </div>
              )}
              <MobileVideoSwipeStart
                locale={locale}
                disabled={battery === 0}
                onCommit={() => void handleStartOrNext()}
              >
              <div
                className={`theater-video-shell relative h-full min-h-0 rounded-2xl ${
                  mobileTheaterChrome ? "min-h-0 flex-1 overflow-hidden rounded-none" : ""
                }`}
              >
              <VideoBridge
                locale={locale}
                searching={searching}
                connectionDegraded={connectionDegraded}
                premiumSecondsLeft={premiumSecondsLeft}
                premiumTotal={PREMIUM_DURATION_SEC}
                activeFilter={activeFilter}
                beautyBlurOverlayVisible={beautyBlurOverlayVisible}
                onBeautyBlurActivate={handleBeautyBlurActivate}
                onBeautyBlurRemove={handleBeautyBlurRemove}
                beautyBlurLoading={beautyBlurLoading}
                canAffordBeautyBlur={coins >= BEAUTY_BLUR_COST_PER_MIN || !!onSpend}
                ghostMode={ghostMode}
                liveTranslationEnabled={liveTranslationEnabled}
                onLiveTranslationInsufficientBalance={handleLiveTranslationInsufficientBalance}
                aiTranslationUi={aiTranslationUi}
                reaction={incomingReaction || localReaction}
                onReactionComplete={handleReactionOverlayComplete}
                showCrownOnPartner={!!(connected && partnerId && top1UserId === partnerId)}
                showCrownOnSelf={!!(userId && top1UserId === userId)}
                leaderboard={leaderboard}
                leaderboardLocale={locale}
                leaderboardCurrentUserId={userId}
                onGoGhost={onOpenShop}
                partnerVideoBlurred={connected && !searching && !partnerVideoRevealed}
                partnerVideoCountdown={partnerVideoCountdown}
                onInstantReveal={handleInstantReveal}
                canAffordInstantReveal={coins >= INSTANT_REVEAL_COST}
                onOpenShop={onOpenShop}
                batteryDepletedBlur={battery === 0 && connected && !searching}
                activeGift={activeGift}
                onGiftComplete={handleGiftComplete}
                isWhale={isWhale}
                partnerIsPremium={partnerIsPremium}
                partnerIsVipOrTopSpender={!!(connected && partnerId && (partnerIsPremium || top1UserId === partnerId))}
                showBioCard={!!(connected && !searching && partnerId && showBioCard)}
                partnerInterests={["Music", "Travel", "Photography"]}
                partnerGiftsReceived={0}
                partnerName={partnerNickname ?? "Partner"}
                partnerNickname={partnerNickname}
                selfDisplayName={viewerNickname}
                partnerCountryCode={partnerCountryCode}
                partnerLocale={locale}
                onBioCardDismiss={() => setShowBioCard(false)}
                showPartnerSkeleton={showPartnerSkeleton}
                userRank={getRankFromCoinsSpent(sessionSpent)}
                onReport={handleReport}
                showReportButton={connected && !searching && !!partnerId}
                theaterGiftsEnabled={connected && !searching && !!partnerId}
                theaterGiftCoins={coins}
                onTheaterGift={handleSendGift}
                liveKitRoomName={liveKitRoomName}
                liveKitIdentityKey={userId}
                partnerVideoGift={partnerVideoGift}
                onPartnerVideoGiftComplete={handlePartnerVideoGiftComplete}
                onSpend={onSpend}
                neonWhisperEnabled={Boolean(
                  userId && connected && !searching && useRealMatching
                )}
                transitionOutActive={videoTransitionOut}
                mobileSplitActive={mobileInCallMode}
              />
              </div>
              </MobileVideoSwipeStart>
              {searching && useRealMatching && (
                <div className="absolute left-3 top-3 z-20 flex max-w-[min(calc(100vw-1.5rem),19rem)] flex-col gap-2 rounded-xl border border-white/10 bg-black/55 p-2 shadow-lg backdrop-blur-md">
                  {userId && (
                    <div className="rounded-lg border border-violet-500/35 bg-violet-950/40 p-2 text-[11px]">
                      <p className="font-medium text-violet-200/95">
                        🤖 AI Whisper is ready — we&apos;ll translate your conversation live.
                      </p>
                      <label className="mt-1.5 flex flex-wrap items-center gap-1.5 text-white/55">
                        <span>Translate to:</span>
                        <select
                          value={translateTargetCode}
                          onChange={(e) => {
                            const v = e.target.value;
                            setTranslateTargetCode(v);
                            setStoredTranslationTargetCode(v);
                          }}
                          className="max-w-[11rem] rounded-md border border-white/15 bg-black/70 py-1 pl-1.5 pr-2 text-[11px] text-white"
                        >
                          {TRANSLATION_TARGET_OPTIONS.map((o) => (
                            <option key={o.code} value={o.code}>
                              {o.flag} {o.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  )}
                  <MatchFilterBar
                    filter={matchFilter}
                    onFilterChange={(f) => {
                      if (requireAuth()) return;
                      setMatchFilter(f);
                    }}
                    disabled={false}
                  />
                  <MatchTargetCountryBar
                    locale={locale}
                    value={matchTargetCountry}
                    onChange={(code) => {
                      if (requireAuth()) return;
                      setMatchTargetCountry(code);
                    }}
                    coins={coins}
                    onOpenShop={onOpenShop}
                    disabled={false}
                  />
                </div>
              )}
              {searching && useRealMatching && (
                <QueuePreview
                  locale={locale}
                  visible={searching}
                  coins={coins}
                  onSpend={onSpend}
                  setCoins={setCoins}
                  onOpenShop={onOpenShop}
                  onWalletRefetch={onWalletRefetch}
                  onBoostedMatch={(pid, pNick) => {
                    setSearching(false);
                    setConnected(true);
                    setPartnerId(pid);
                    setPartnerNickname(typeof pNick === "string" ? pNick : null);
                  }}
                />
              )}
              {mobileTheaterChrome && (
                <div
                  className="absolute bottom-0 left-0 right-0 z-[45] flex min-h-[60px] items-center justify-center gap-1.5 border-t border-fuchsia-500/25 bg-black/70 px-2.5 py-1.5 shadow-[0_-8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md [padding-bottom:max(6px,env(safe-area-inset-bottom))]"
                  role="toolbar"
                  aria-label="Stop, reactions, and next"
                >
                  <button
                    type="button"
                    onClick={handleStop}
                    className="shrink-0 rounded-3xl border border-white/25 px-5 py-2 text-sm font-bold text-white/80 transition-all hover:bg-white/10 active:scale-[0.98]"
                  >
                    {t.stopBtn}
                  </button>
                  {(
                    [
                      { id: "heart" as ReactionId, emoji: "❤️", label: "Heart" },
                      { id: "laugh" as ReactionId, emoji: "😂", label: "Laugh" },
                      { id: "love" as ReactionId, emoji: "😍", label: "Like" },
                    ] as const
                  ).map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        if (isGuest) {
                          onGuestPaywallTrigger?.("gift");
                          return;
                        }
                        void handleSendReaction(r.id);
                      }}
                      className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-xl shadow-[0_0_16px_rgba(236,72,153,0.15)] transition active:scale-90"
                      aria-label={r.label}
                    >
                      {r.emoji}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => void handleStartOrNext()}
                    disabled={battery === 0}
                    className={`relative shrink-0 rounded-3xl border-0 px-7 py-2 text-sm font-bold text-white shadow-none outline-none ring-0 ring-offset-0 transition-all focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 active:scale-[0.98] ${
                      battery === 0
                        ? "cursor-not-allowed bg-zinc-600 opacity-60"
                        : "btn-gradient-neon hover:opacity-95"
                    }`}
                  >
                    {t.nextBtn}
                  </button>
                </div>
              )}
            </div>
          <VideoAdOverlay visible={showVideoAd} onClose={() => setShowVideoAd(false)} />
          <GenderFilterCTA
            visible={showGenderFilterCTA}
            onClose={() => setShowGenderFilterCTA(false)}
            onSelectGenderFilter={() => setShowGenderFilterCTA(false)}
            locale={locale}
          />
          <p
            className={`single-screen-compact mt-1 text-center text-xs text-white/65 sm:text-sm ${
              mobileTheaterChrome ? "hidden" : ""
            }`}
          >
            {t.subPlayerText}
          </p>
          <div className={`action-bar sticky bottom-0 z-20 mt-0 shrink-0 rounded-2xl border border-white/10 bg-black/55 backdrop-blur-xl ${
            mobileTheaterChrome ? "hidden" : ""
          } ${isDesktop ? "px-4 py-3" : "px-2 py-2"}`}>
          <div
            className={`flex flex-wrap items-center justify-between ${isDesktop ? "gap-4" : "gap-2"}`}
          >
            <div className={`flex ${isDesktop ? "gap-3" : "gap-2"}`}>
              <button
                type="button"
                onClick={handleStartOrNext}
                disabled={battery === 0}
                className={`relative rounded-full border-0 font-semibold text-white shadow-none outline-none ring-0 ring-offset-0 transition-all focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 active:scale-[0.98] ${
                  isDesktop
                    ? "min-h-[52px] min-w-[140px] px-8 py-3.5 text-base"
                    : "min-h-[44px] min-w-[100px] px-5 py-2 text-sm"
                } ${
                  !connected ? "max-md:hidden" : ""
                } ${
                  battery === 0
                    ? "cursor-not-allowed bg-zinc-600 opacity-60"
                    : "btn-gradient-neon hover:opacity-95"
                }`}
              >
                {!connected && (
                  <span
                    className="absolute -top-2 -right-1 rounded bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                    style={{ boxShadow: "0 0 10px rgba(16, 185, 129, 0.6)" }}
                  >
                    {t.freeBadge}
                  </span>
                )}
                {connected ? t.nextBtn : t.startBtn}
              </button>
              {connected && (
                <button
                  type="button"
                  onClick={handleStop}
                  className={`rounded-full border border-white/25 font-semibold text-white/80 transition-all hover:bg-white/10 active:scale-[0.98] ${
                    isDesktop
                      ? "min-h-[50px] min-w-[118px] px-7 py-3 text-base"
                      : "min-h-[44px] min-w-[84px] px-4 py-2 text-sm"
                  }`}
                >
                  {t.stopBtn}
                </button>
              )}
              {showUndoBack && previousPartnerId && useRealMatching && (
                <button
                  type="button"
                  onClick={handleUndoNext}
                  disabled={coins < UNDO_NEXT_COST}
                  className="min-h-[40px] rounded-full border border-violet-500/60 bg-violet-950/70 px-4 py-2 text-sm font-medium text-violet-300 transition-all hover:bg-violet-900/60 active:scale-[0.98] disabled:opacity-50"
                >
                  {t.undoBackBtn}
                </button>
              )}
            </div>
            <div className={`flex ${isDesktop ? "gap-3" : "gap-2"}`}>
              <button
                type="button"
                onClick={onOpenShop}
                className={`rounded-full border border-fuchsia-400/40 bg-fuchsia-950/30 font-semibold text-fuchsia-100 transition-all hover:bg-fuchsia-900/35 ${
                  isDesktop
                    ? "min-h-[48px] min-w-[88px] px-4 py-2.5 text-sm"
                    : "min-h-[40px] min-w-[72px] px-2.5 py-1.5 text-xs"
                } ${mobileTheaterChrome ? "hidden" : ""}`}
              >
                Gifts
              </button>
              {connected && partnerId && useRealMatching && (
                <button
                  type="button"
                  onClick={handleInvite}
                  disabled={inviteLoading || !socketConnected || (coins < PRIVATE_ROOM_COST_PER_MIN && !onSpend)}
                  className={`rounded-full bg-[#8b5cf6]/80 font-medium text-white transition-all active:scale-[0.98] hover:bg-[#8b5cf6] disabled:opacity-50 ${
                    isDesktop
                      ? "min-h-[50px] min-w-[92px] px-5 py-3 text-base"
                      : "min-h-[40px] min-w-[76px] px-3 py-2 text-sm"
                  }`}
                >
                  {t.privateInviteBtn}
                </button>
              )}
              <button
                type="button"
                onClick={handleReport}
                className={`rounded-full border border-white/20 font-medium text-white/80 transition-all active:scale-[0.98] hover:bg-white/10 ${
                  isDesktop
                    ? "min-h-[48px] min-w-[92px] px-5 py-3 text-base"
                    : "min-h-[40px] min-w-[76px] px-3 py-2 text-sm"
                } ${mobileTheaterChrome ? "hidden" : ""}`}
              >
                {t.reportBtn}
              </button>
              <button
                type="button"
                className={`rounded-full border border-white/20 font-medium text-white/80 transition-all active:scale-[0.98] hover:bg-white/10 ${
                  isDesktop
                    ? "min-h-[48px] min-w-[92px] px-5 py-3 text-base"
                    : "min-h-[40px] min-w-[76px] px-3 py-2 text-sm"
                } ${mobileTheaterChrome ? "hidden" : ""}`}
              >
                {t.blockBtn}
              </button>
            </div>
          </div>
          <div className={`mt-2 flex items-center ${isDesktop ? "gap-3" : "gap-2"} ${mobileTheaterChrome ? "hidden" : ""}`}>
            <input
              type="text"
              value={quickChatDraft}
              onChange={(e) => setQuickChatDraft(e.target.value)}
              onFocus={() => {
                if (isGuest) onGuestPaywallTrigger?.("chat");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleQuickChatSend();
                }
              }}
              placeholder={isGuest ? "Login to start chatting..." : "Open Pulse chat to type..."}
              className="min-h-[42px] flex-1 rounded-xl border border-white/15 bg-black/45 px-3 text-sm text-white/85 placeholder:text-white/40 focus:border-violet-400/60 focus:outline-none"
            />
            {!isGuest && (
              <button
                type="button"
                onClick={handleQuickChatSend}
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-violet-400/50 bg-violet-900/40 px-4 text-xs font-semibold text-violet-100"
              >
                <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M21.5 3.8 10.2 15.1M21.5 3.8l-7.2 16.4-4.1-7.7-7.7-4.1L21.5 3.8Z"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Send</span>
              </button>
            )}
          </div>
          </div>
        </div>
        {commonInterestFlash && (
          <div className="absolute left-1/2 top-24 z-30 -translate-x-1/2 rounded-lg bg-violet-500/90 px-4 py-2 text-sm font-semibold text-white shadow-lg animate-in fade-in duration-300">
            {commonInterestFlash}
          </div>
        )}
      </div>
      <PrivateInviteModal
        locale={locale}
        visible={!!inviteFromUserId && !!inviteRoomId}
        fromUserId={inviteFromUserId ?? ""}
        roomId={inviteRoomId ?? ""}
        onAccept={handleAcceptInvite}
        onDecline={handleDeclineInvite}
      />
      <ModerationViolationModal visible={moderationViolationVisible} />
      <BatteryDepletedModal
        locale={locale}
        visible={batteryDepletedModalVisible}
        onQuickCharge={handleQuickCharge}
        onOpenShop={onOpenShop}
        canAfford={coins >= BATTERY_QUICK_CHARGE_COST || !!onSpend}
        loading={batteryChargeLoading}
        isAuthenticated={!!userId}
        userId={userId ?? undefined}
        onBatteryRefilled={() => {
          if (userId) {
            fetch("/api/battery")
              .then((r) => r.json())
              .then((d) => {
                if (d?.battery != null) {
                  setBattery(Math.max(0, Math.min(100, d.battery)));
                  setBatteryDepletedModalVisible(false);
                }
              })
              .catch(() => {});
          }
        }}
      />
      <SessionSummaryModal
        visible={sessionSummaryVisible}
        onClose={handleSessionSummaryClose}
        stats={{
          peopleTalkedTo: nextCount + (connected && partnerId ? 1 : 0),
          giftsReceived: giftsReceivedCount,
          minutesOnline: Math.max(0, Math.floor((Date.now() - connectionStartedAtRef.current) / 60000)),
        }}
      />
    </section>
  );
}
