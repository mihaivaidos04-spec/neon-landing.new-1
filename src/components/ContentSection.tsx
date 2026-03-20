"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ContentLocale } from "../lib/content-i18n";
import type { FilterType } from "../lib/access";
import { getContentT } from "../lib/content-i18n";
import { canAffordGift, getGiftCost, BEAUTY_BLUR_COST_PER_MIN, GHOST_MODE_COST_PER_2MIN, GHOST_MODE_INTERVAL_MS, LIVE_TRANSLATION_COST_PER_MIN, UNDO_NEXT_COST, INSTANT_REVEAL_COST, BATTERY_QUICK_CHARGE_COST, BATTERY_QUICK_CHARGE_AMOUNT, PRIVATE_ROOM_COST_PER_MIN } from "../lib/coins";
import { feedbackClick, feedbackSuccess, playLowBatterySound, playGiftSound, playWhooshSound, triggerPremiumGiftHaptic } from "../lib/feedback";
import { getDailyQuestProgress, setDailyQuestProgress } from "../lib/daily-quest-storage";
import DailyQuestPanel, { DAILY_GOAL, DAILY_REWARD_COINS } from "./DailyQuestPanel";
import DailyRewardCalendar from "./DailyRewardCalendar";
import { type GiftId, getGiftName } from "./GiftsBar";
import { GiftShopQuestStack } from "./GiftShopPanel";
import StageLeftRail from "./StageLeftRail";
import type { ActiveGift } from "./GiftLayer";
import VideoBridge from "./VideoBridge";
import VideoAdOverlay from "./VideoAdOverlay";
import GenderFilterCTA from "./GenderFilterCTA";
import MatchFilterBar, { type MatchFilter } from "./MatchFilterBar";
import QueuePreview from "./QueuePreview";
import PrivateInviteModal from "./PrivateInviteModal";
import { useSocketContext } from "../contexts/SocketContext";
import type { VideoFilterId } from "../lib/video-filters";
import type { ReactionId } from "../lib/reactions";
import { getReactionCost } from "../lib/coins";
import { useReactions } from "../hooks/useReactions";
import { useLeaderboard } from "../hooks/useLeaderboard";
import { useDailyReward } from "../hooks/useDailyReward";
import BatteryIndicator from "./BatteryIndicator";
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
import confetti from "canvas-confetti";

/** Demo: 2 min premium countdown; when 0, silent downgrade + blur + system messages */
const PREMIUM_DURATION_SEC = 120;
const BEAUTY_BLUR_FREE_SEC = 30;

type Props = {
  locale?: ContentLocale;
  coins: number;
  setCoins: (fn: (prev: number) => number) => void;
  onOpenShop: () => void;
  /** Navigate to checkout with starter bundle for full battery recharge (auth users) */
  onRechargeWithPayment?: () => void;
  onOpenGenderFilter?: () => void;
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
  /** Shown on gift overlay (e.g. session name) */
  viewerDisplayName?: string | null;
};

const MATCH_POLL_MS = 500;
const MATCH_TIMEOUT_MS = 30000;
/** ~3% / min apel — ~25% în ~8–9 min (mai lent decât 5%/min) */
const BATTERY_DRAIN_MS = 60 * 1000;
const BATTERY_DRAIN_VIP_MS = 2 * 60 * 1000; // VIP: același drain la 2× interval
const BATTERY_HEARTBEAT_DRAIN = 3;

export default function ContentSection({
  locale = "en",
  coins,
  setCoins,
  onOpenShop,
  onRechargeWithPayment,
  onOpenGenderFilter,
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
  viewerDisplayName = null,
}: Props) {
  const [activeGift, setActiveGift] = useState<ActiveGift | null>(null);
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
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [previousPartnerId, setPreviousPartnerId] = useState<string | null>(null);
  const [showUndoBack, setShowUndoBack] = useState(false);
  const [localReaction, setLocalReaction] = useState<ReactionId | null>(null);
  const [inviteFromUserId, setInviteFromUserId] = useState<string | null>(null);
  const [inviteRoomId, setInviteRoomId] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [partnerVideoRevealed, setPartnerVideoRevealed] = useState(false);
  const [partnerVideoCountdown, setPartnerVideoCountdown] = useState<number | null>(null);
  const [battery, setBattery] = useState(100);
  const [isVipSubscriber, setIsVipSubscriber] = useState(false);
  const [batteryDepletedModalVisible, setBatteryDepletedModalVisible] = useState(false);
  const [batteryChargeLoading, setBatteryChargeLoading] = useState(false);
  const [batteryLoading, setBatteryLoading] = useState(!!userId);
  const [zeroDrainUntil, setZeroDrainUntil] = useState<number>(0);
  const [matchFilter, setMatchFilter] = useState<MatchFilter>("everyone");
  const [partnerIsPremium, setPartnerIsPremium] = useState(false);
  const [showBioCard, setShowBioCard] = useState(true);
  const [ghostModeChargedAt, setGhostModeChargedAt] = useState<number>(0);
  const [sessionSummaryVisible, setSessionSummaryVisible] = useState(false);
  const [giftsReceivedCount, setGiftsReceivedCount] = useState(0);
  const [commonInterestFlash, setCommonInterestFlash] = useState<string | null>(null);
  const [showPartnerSkeleton, setShowPartnerSkeleton] = useState(false);
  const [partnerCountryCode, setPartnerCountryCode] = useState<string | null>(null);
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
  const nextSoundRef = useRef<HTMLAudioElement | null>(null);
  const undoBackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectionStartedAtRef = useRef<number>(0);
  const batteryRef = useRef(battery);
  batteryRef.current = battery;
  const hasPlayedLowBatteryRef = useRef(false);
  const t = getContentT(locale);

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
    if (requireAuth()) return;
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
    setPartnerIsPremium(false);
    setShowBioCard(true);

    if (useRealMatching) {
      (async () => {
        await fetch("/api/match/leave", { method: "POST" }).catch(() => {});
        const res = await fetch("/api/match/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filter: matchFilter }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 403) {
          setSearching(false);
          toast.error(data?.error ?? "Your account is temporarily restricted. Please try again later.");
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
          if (data.partnerId) setPartnerId(data.partnerId);
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
            if (d.partnerId) setPartnerId(d.partnerId);
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
  }, [connected, nextCount, dailyQuestCompleted, dailyQuestCount, setCoins, onAddCoins, ensureFilterAccess, premiumSecondsLeft, onMissionIncrement, useRealMatching, partnerId, matchFilter, requireAuth]);

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
        if (data.partnerId) setPartnerId(data.partnerId);
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
            if (d.partnerId) setPartnerId(d.partnerId);
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

  const handleLiveTranslationToggle = useCallback(() => {
    if (liveTranslationEnabled) {
      setLiveTranslationEnabled(false);
      return;
    }
    if (requireAuth()) return;
    if (coinsRef.current < LIVE_TRANSLATION_COST_PER_MIN && !onSpend) {
      toast(t.needCoinsMessage, { icon: "💎" });
      onOpenShop();
      return;
    }
    setLiveTranslationEnabled(true);
    feedbackSuccess();
  }, [liveTranslationEnabled, t.needCoinsMessage, onOpenShop, onSpend, requireAuth]);

  const handleSendReaction = useCallback(
    async (reactionId: ReactionId) => {
      if (requireAuth()) return;
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
    [partnerId, userId, onSpend, setCoins, onWalletRefetch, t.needCoinsMessage, onOpenShop, requireAuth]
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
    if (useRealMatching) {
      fetch("/api/match/leave", { method: "POST" }).catch(() => {});
    }
  }, [useRealMatching]);

  const handleModerationViolation = useCallback(() => {
    setModerationViolationVisible(true);
    setConnected(false);
    setSearching(true);
    setPartnerId(null);
    if (useRealMatching) {
      fetch("/api/match/leave", { method: "POST" }).catch(() => {});
    }
    toast.error("Violation detected. Your account is flagged.");
  }, [useRealMatching]);

  const handleSendGift = useCallback(
    async (giftId: GiftId) => {
      if (requireAuth()) return;
      const cost = getGiftCost(giftId);
      if (!canAffordGift(coins, giftId)) {
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
      const giftLabel = getGiftName(giftId, locale);
      setActiveGift({
        giftId,
        receivedAt: Date.now(),
        senderLabel: sender,
        giftLabel,
      });
      setTopSupportersRefreshKey((k) => k + 1);
      playGiftSound();
      if (cost >= 10 && typeof navigator !== "undefined" && "vibrate" in navigator) {
        triggerPremiumGiftHaptic();
      }
      const giftName = getGiftName(giftId, locale);
      toast(t.giftSentToast.replace("{{giftName}}", giftName));
    },
    [coins, t.needCoinsMessage, t.giftSentToast, setCoins, onOpenShop, onSpend, locale, requireAuth, viewerDisplayName]
  );

  const handleGiftComplete = useCallback(() => {
    setActiveGift(null);
  }, []);

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
    const fire = (opts: { origin?: { x: number; y: number }; colors?: string[]; spread?: number }) =>
      confetti({ ...opts, particleCount: 40, scalar: 0.8, ticks: 120 });
    fire({ origin: { x: 0.25, y: 0.5 }, colors: ["#8b5cf6", "#a78bfa", "#39ff14"], spread: 55 });
    fire({ origin: { x: 0.75, y: 0.5 }, colors: ["#8b5cf6", "#a78bfa", "#39ff14"], spread: 55 });
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

  // Mystery Box: battery bonus & zero-drain from custom events
  useEffect(() => {
    const onBattery = (e: Event) => {
      const { amount } = (e as CustomEvent<{ amount: number }>).detail ?? {};
      if (amount) {
        setBattery((prev) => Math.min(100, prev + amount));
        if (userId) fetch("/api/battery").then((r) => r.json()).then((d) => d?.battery != null && setBattery(d.battery)).catch(() => {});
      }
    };
    const onZeroDrain = (e: Event) => {
      const { minutes } = (e as CustomEvent<{ minutes: number }>).detail ?? {};
      if (minutes) setZeroDrainUntil(Date.now() + minutes * 60 * 1000);
    };
    window.addEventListener("mystery-box-battery", onBattery);
    window.addEventListener("mystery-box-zero-drain", onZeroDrain);
    return () => {
      window.removeEventListener("mystery-box-battery", onBattery);
      window.removeEventListener("mystery-box-zero-drain", onZeroDrain);
    };
  }, [userId]);

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
        body: JSON.stringify({ filter: matchFilter }),
      });
      if (cancelled) return;
      const data = await res.json().catch(() => ({}));
      if (res.status === 403) {
        setSearching(false);
        toast.error(data?.error ?? "Your account is temporarily restricted. Please try again later.");
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
        if (data.partnerId) setPartnerId(data.partnerId);
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
          if (d.partnerId) setPartnerId(d.partnerId);
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
  }, [useRealMatching, matchFilter]);

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

  // Live translation: deduct 3 coins every 60s when active
  useEffect(() => {
    if (!liveTranslationEnabled || !connected) return;
    const deduct = async () => {
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
  }, [liveTranslationEnabled, connected, onSpend, setCoins, handleLiveTranslationInsufficientBalance]);

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
    onBeforeInteraction: requireAuth,
  };

  return (
    <section className="mt-0 w-full max-w-full overflow-x-hidden xl:overflow-x-visible">
      <div className="relative flex w-full max-w-full flex-col gap-3 xl:flex-row xl:items-start xl:gap-3 xl:overflow-visible">
        {/* Slim left rail — icon row below video on mobile, vertical rail on xl */}
        <div className="order-2 w-full shrink-0 xl:order-1 xl:w-auto xl:overflow-visible">
          <StageLeftRail
            locale={locale}
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
        <div className="order-1 flex min-w-0 w-full flex-1 flex-col gap-3 xl:order-2 xl:min-w-0">
          <div className="theater-stage theater-ambient-glow relative z-[1] mt-0 w-full min-w-0 rounded-2xl xl:mx-0 xl:mt-0">
              <div className="theater-video-shell relative overflow-hidden rounded-2xl">
              <div className="absolute left-3 top-3 z-10 flex flex-col gap-1">
                {batteryLoading ? (
                  <span className="neon-spinner-sm" aria-hidden />
                ) : (
                  <BatteryIndicator percent={battery} />
                )}
                {battery < 25 && battery > 0 && (
                  <span className="rounded bg-red-500/80 px-2 py-0.5 text-[10px] font-semibold text-white shadow-lg">
                    {t.batteryLowPowerWarning}
                  </span>
                )}
              </div>
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
                partnerName="Partner"
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
                topSupportersRefreshKey={topSupportersRefreshKey}
              />
              </div>
              {searching && useRealMatching && (
                <div className="absolute left-3 top-14 z-20">
                  <MatchFilterBar
                    filter={matchFilter}
                    onFilterChange={(f) => {
                      if (requireAuth()) return;
                      setMatchFilter(f);
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
                  onBoostedMatch={(partnerId) => {
                    setSearching(false);
                    setConnected(true);
                    setPartnerId(partnerId);
                  }}
                />
              )}
            </div>
          <VideoAdOverlay visible={showVideoAd} onClose={() => setShowVideoAd(false)} />
          <GenderFilterCTA
            visible={showGenderFilterCTA}
            onClose={() => setShowGenderFilterCTA(false)}
            onSelectGenderFilter={() => onOpenGenderFilter?.() ?? onOpenShop()}
            locale={locale}
          />
          <p className="mt-2 text-center text-xs text-white/70 sm:text-sm">
            {t.subPlayerText}
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleStartOrNext}
                disabled={battery === 0}
                className={`relative min-h-[52px] min-w-[120px] rounded-full px-8 py-3.5 text-base font-semibold text-white transition-all active:scale-[0.98] sm:min-h-[56px] sm:min-w-[140px] sm:px-10 sm:py-4 ${
                  battery === 0
                    ? "cursor-not-allowed bg-zinc-600 opacity-60"
                    : "btn-gradient-neon hover:opacity-95"
                }`}
                style={battery > 0 ? { boxShadow: "0 0 20px rgba(139, 92, 246, 0.4)" } : undefined}
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
                  className="min-h-[52px] min-w-[100px] rounded-full border border-white/25 px-6 py-3.5 font-semibold text-white/80 transition-all hover:bg-white/10 active:scale-[0.98] sm:min-h-[56px] sm:min-w-[120px] sm:px-8 sm:py-4"
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
            <div className="flex gap-2">
              {connected && partnerId && useRealMatching && (
                <button
                  type="button"
                  onClick={handleInvite}
                  disabled={inviteLoading || !socketConnected || (coins < PRIVATE_ROOM_COST_PER_MIN && !onSpend)}
                  className="min-h-[44px] min-w-[80px] rounded-full bg-[#8b5cf6]/80 px-4 py-3 text-sm font-medium text-white transition-all active:scale-[0.98] hover:bg-[#8b5cf6] disabled:opacity-50 sm:min-h-[48px]"
                >
                  {t.privateInviteBtn}
                </button>
              )}
              <button
                type="button"
                onClick={handleReport}
                className="min-h-[44px] min-w-[80px] rounded-full border border-white/20 px-4 py-3 text-sm font-medium text-white/80 transition-all active:scale-[0.98] hover:bg-white/10 sm:min-h-[48px]"
              >
                {t.reportBtn}
              </button>
              <button
                type="button"
                className="min-h-[44px] min-w-[80px] rounded-full border border-white/20 px-4 py-3 text-sm font-medium text-white/80 transition-all active:scale-[0.98] hover:bg-white/10 sm:min-h-[48px]"
              >
                {t.blockBtn}
              </button>
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
        onRechargeWithPayment={onRechargeWithPayment}
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
