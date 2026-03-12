"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ContentLocale } from "../lib/content-i18n";
import type { FilterType } from "../lib/access";
import { getContentT } from "../lib/content-i18n";
import { canAffordGift, getGiftCost, BEAUTY_BLUR_COST_PER_MIN, GHOST_MODE_COST_PER_2MIN, GHOST_MODE_INTERVAL_MS, LIVE_TRANSLATION_COST_PER_MIN, UNDO_NEXT_COST, INSTANT_REVEAL_COST, BATTERY_QUICK_CHARGE_COST, BATTERY_QUICK_CHARGE_AMOUNT, PRIVATE_ROOM_COST_PER_MIN, ICEBREAKER_COST } from "../lib/coins";
import { feedbackClick, feedbackSuccess, playLowBatterySound, playGiftSound, playWhooshSound, triggerPremiumGiftHaptic } from "../lib/feedback";
import { getDailyQuestProgress, setDailyQuestProgress } from "../lib/daily-quest-storage";
import ChatPanel, { type ChatMessage } from "./ChatPanel";
import DailyQuestPanel, { DAILY_GOAL, DAILY_REWARD_COINS } from "./DailyQuestPanel";
import DailyRewardCalendar from "./DailyRewardCalendar";
import { generateFakeMessage } from "../lib/chat-messages-data";
import GiftsBar, { type GiftId, getGiftName } from "./GiftsBar";
import type { ActiveGift } from "./GiftLayer";
import VideoBridge from "./VideoBridge";
import VideoAdOverlay from "./VideoAdOverlay";
import GenderFilterCTA from "./GenderFilterCTA";
import MatchFilterBar, { type MatchFilter } from "./MatchFilterBar";
import VideoFilterBar from "./VideoFilterBar";
import ReactionBar from "./ReactionBar";
import ReactionOverlay from "./ReactionOverlay";
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
import { moderateText, isSpamLike } from "../lib/text-moderation";
import { isChatBlocked, getChatBlockRemainingMs, recordSpamMessage, recordCleanMessage } from "../lib/chat-block-store";
import toast from "react-hot-toast";

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
};

const MATCH_POLL_MS = 500;
const MATCH_TIMEOUT_MS = 30000;
const BATTERY_DRAIN_MS = 60 * 1000; // 60 sec – heartbeat every minute, -5 units
const BATTERY_DRAIN_VIP_MS = 2 * 60 * 1000; // 2 min for VIP (2x slower)

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
  onMissionIncrement,
  useRealMatching = false,
  userId = null,
  onWalletRefetch,
  onNavigateToPrivate,
  isWhale = false,
  sessionSpent = 0,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeGift, setActiveGift] = useState<ActiveGift | null>(null);
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
  const [chatBlockRemainingMs, setChatBlockRemainingMs] = useState(0);
  const [giftsReceivedCount, setGiftsReceivedCount] = useState(0);
  const [commonInterestFlash, setCommonInterestFlash] = useState<string | null>(null);
  const [showPartnerSkeleton, setShowPartnerSkeleton] = useState(false);
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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextSoundRef = useRef<HTMLAudioElement | null>(null);
  const undoBackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectionStartedAtRef = useRef<number>(0);
  const batteryRef = useRef(battery);
  batteryRef.current = battery;
  const hasPlayedLowBatteryRef = useRef(false);
  const t = getContentT(locale);

  // ─── Handlers (useCallback) – toate la început, înainte de useEffect ───
  const handleInstantReveal = useCallback(async () => {
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
  }, [onSpend, setCoins, onWalletRefetch, onOpenShop]);

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
    setMessages((prev) => [
      ...prev,
      {
        id: `live-translation-stop-${Date.now()}`,
        user: "",
        text: t.needCoinsMessage,
        isSystem: true,
        actionLabel: t.seeOptionsLabel,
      },
    ]);
    onOpenShop();
  }, [t.needCoinsMessage, t.seeOptionsLabel, onOpenShop]);

  const handleStartOrNext = useCallback(async () => {
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
  }, [connected, nextCount, dailyQuestCompleted, dailyQuestCount, setCoins, onAddCoins, ensureFilterAccess, premiumSecondsLeft, onMissionIncrement, useRealMatching, partnerId, matchFilter]);

  const handleUndoNext = useCallback(async () => {
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
  }, [previousPartnerId, coins, onSpend, onWalletRefetch, onOpenShop]);

  const handleSelectFilter = useCallback((filter: VideoFilterId) => {
    if (filter === "beauty_blur") {
      setBeautyBlurFreeSecondsLeft(BEAUTY_BLUR_FREE_SEC);
      setBeautyBlurPaid(false);
      setBeautyBlurOverlayVisible(false);
    } else {
      setBeautyBlurPaid(false);
      setBeautyBlurOverlayVisible(false);
    }
    setActiveFilter(filter);
  }, []);

  const handleBeautyBlurActivate = useCallback(async () => {
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
  }, [onSpend, setCoins]);

  const handleBeautyBlurRemove = useCallback(() => {
    setActiveFilter("none");
    setBeautyBlurPaid(false);
    setBeautyBlurOverlayVisible(false);
  }, []);

  useEffect(() => {
    const tick = () => {
      if (isChatBlocked()) {
        setChatBlockRemainingMs(getChatBlockRemainingMs());
      } else {
        setChatBlockRemainingMs(0);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleSendMessage = useCallback((text: string) => {
    if (isChatBlocked()) return;
    const result = moderateText(text);
    if (isSpamLike(result)) {
      recordSpamMessage();
      setMessages((prev) => [
        ...prev,
        { id: `msg-${Date.now()}`, user: "You", text: result.filtered, isSystem: false, isDonor: false },
      ]);
      toast.error("Message filtered. Avoid banned words, links, or phone numbers.");
      if (isChatBlocked()) {
        setChatBlockRemainingMs(getChatBlockRemainingMs());
        toast.error("3 spam messages in a row. Chat blocked for 10 minutes.");
      }
    } else {
      recordCleanMessage();
      setMessages((prev) => [
        ...prev,
        { id: `msg-${Date.now()}`, user: "You", text: result.filtered, isSystem: false, isDonor: false },
      ]);
    }
  }, []);

  const handleLiveTranslationToggle = useCallback(() => {
    if (liveTranslationEnabled) {
      setLiveTranslationEnabled(false);
      return;
    }
    if (coinsRef.current < LIVE_TRANSLATION_COST_PER_MIN && !onSpend) {
      setMessages((prev) => [
        ...prev,
        {
          id: `need-coins-live-${Date.now()}`,
          user: "",
          text: t.needCoinsMessage,
          isSystem: true,
          actionLabel: t.seeOptionsLabel,
        },
      ]);
      onOpenShop();
      return;
    }
    setLiveTranslationEnabled(true);
    feedbackSuccess();
  }, [liveTranslationEnabled, t.needCoinsMessage, t.seeOptionsLabel, onOpenShop, onSpend]);

  const handleSendReaction = useCallback(
    async (reactionId: ReactionId) => {
      const cost = getReactionCost(reactionId);
      if (coinsRef.current < cost && !onSpend) {
        setMessages((prev) => [
          ...prev,
          {
            id: `need-coins-react-${Date.now()}`,
            user: "",
            text: t.needCoinsMessage,
            isSystem: true,
            actionLabel: t.seeOptionsLabel,
          },
        ]);
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
    [partnerId, userId, onSpend, setCoins, onWalletRefetch, t.needCoinsMessage, t.seeOptionsLabel, onOpenShop]
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
    if (coinsRef.current < GHOST_MODE_COST_PER_2MIN && !onSpend) {
      setMessages((prev) => [
        ...prev,
        {
          id: `need-coins-ghost-${Date.now()}`,
          user: "",
          text: t.needCoinsMessage,
          isSystem: true,
          actionLabel: t.seeOptionsLabel,
        },
      ]);
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
  }, [ghostMode, onSpend, setCoins, t.needCoinsMessage, t.seeOptionsLabel, onOpenShop]);

  // Ghost Mode: charge 1 coin every 2 minutes
  useEffect(() => {
    if (!ghostMode || !connected || searching) return;
    const tid = setInterval(async () => {
      const elapsed = Date.now() - ghostModeChargedAt;
      if (elapsed < GHOST_MODE_INTERVAL_MS) return;
      if (coinsRef.current < GHOST_MODE_COST_PER_2MIN && !onSpend) {
        setGhostMode(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `ghost-expired-${Date.now()}`,
            user: "",
            text: "Ghost Mode ended – insufficient balance",
            isSystem: true,
            actionLabel: t.seeOptionsLabel,
          },
        ]);
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
  }, [ghostMode, connected, searching, ghostModeChargedAt, onSpend, setCoins, onOpenShop, onWalletRefetch, t.seeOptionsLabel]);

  const handleInvite = useCallback(() => {
    if (!socket || !partnerId || !useRealMatching || inviteLoading) return;
    if (coinsRef.current < PRIVATE_ROOM_COST_PER_MIN && !onSpend) {
      onOpenShop();
      return;
    }
    const roomId = crypto.randomUUID();
    pendingInviteRoomIdRef.current = roomId;
    socket.emit("private_invite", { toUserId: partnerId, roomId });
    feedbackSuccess();
  }, [socket, partnerId, useRealMatching, inviteLoading, onSpend, onOpenShop]);

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

  const handleIcebreaker = useCallback(async () => {
    if (coinsRef.current < ICEBREAKER_COST && !onSpend) {
      onOpenShop();
      return;
    }
    const openerRaw = "Hey! So... I was just wondering what kind of pizza would you be? 🍕";
    const opener = moderateText(openerRaw).filtered;
    if (onSpend) {
      const ok = await onSpend(ICEBREAKER_COST, "icebreaker");
      if (!ok) return;
    } else {
      setCoins((c) => c - ICEBREAKER_COST);
    }
    setMessages((prev) => [
      ...prev,
      { id: `icebreaker-${Date.now()}`, user: "You", text: opener, isSystem: false, isDonor: false },
    ]);
    feedbackSuccess();
    await onWalletRefetch?.();
  }, [onSpend, setCoins, onOpenShop, onWalletRefetch]);

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
      const cost = getGiftCost(giftId);
      if (!canAffordGift(coins, giftId)) {
        setMessages((prev) => [
          ...prev,
          {
            id: `need-coins-${Date.now()}`,
            user: "",
            text: t.needCoinsMessage,
            isSystem: true,
            actionLabel: t.seeOptionsLabel,
          },
        ]);
        onOpenShop();
        return;
      }

      if (onSpend) {
        const ok = await onSpend(cost, "gift");
        if (!ok) return;
      } else {
        setCoins((c) => c - cost);
      }
      setActiveGift({ giftId, receivedAt: Date.now() });
      playGiftSound();
      if (cost >= 10 && typeof navigator !== "undefined" && "vibrate" in navigator) {
        triggerPremiumGiftHaptic();
      }
      const giftName = getGiftName(giftId, locale);
      toast(t.giftSentToast.replace("{{giftName}}", giftName));
    },
    [coins, t.needCoinsMessage, t.seeOptionsLabel, t.giftSentToast, setCoins, onOpenShop, onSpend, locale]
  );

  const handleGiftComplete = useCallback(() => {
    setActiveGift(null);
  }, []);

  // ─── useEffect hooks ───
  useEffect(() => {
    if (connected) connectionStartedAtRef.current = Date.now();
  }, [connected]);

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

  // Battery: heartbeat every 60s (2 min VIP) when video active; -5 units; Low Battery event when depleted
  const isZeroDrainActive = zeroDrainUntil > Date.now();
  useEffect(() => {
    if (!connected || searching) return;
    const intervalMs = isVipSubscriber ? BATTERY_DRAIN_VIP_MS : BATTERY_DRAIN_MS;
    const drainAmount = 5;
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

  useEffect(() => {
    const addFake = () => {
      setMessages((prev) => [...prev.slice(-49), generateFakeMessage(locale)]);
    };
    addFake();
    intervalRef.current = setInterval(addFake, 3000 + Math.random() * 4000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [locale]);

  // Premium countdown: system messages at 60s, 30s; at 0 silent downgrade + blur
  useEffect(() => {
    if (premiumSecondsLeft === null || premiumSecondsLeft <= 0) return;
    const tid = setInterval(() => {
      setPremiumSecondsLeft((prev) => {
        if (prev === null || prev <= 0) return prev;
        const next = prev - 1;
        if (next === 0) {
          setMessages((m) => [
            ...m,
            {
              id: `sys-expired-${Date.now()}`,
              user: "",
              text: t.systemFiltersExpired,
              isSystem: true,
              actionLabel: t.systemReactivate,
            },
            {
              id: `sys-degraded-${Date.now()}`,
              user: "",
              text: t.systemConnectionDegraded,
              isSystem: true,
            },
          ]);
          setConnectionDegraded(true);
          return null;
        }
        // No 60s/30s countdown messages — progress bar only (relaxed psychology)
        return next;
      });
    }, 1000);
    return () => clearInterval(tid);
  }, [premiumSecondsLeft, t.systemFiltersExpired, t.systemReactivate, t.systemConnectionDegraded, t.systemSecondsLeft]);

  return (
    <section className="mt-0">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <DailyQuestPanel
            locale={locale}
            current={onMissionIncrement ? (missionCount ?? 0) : dailyQuestCount}
            completed={onMissionIncrement ? (missionCompleted ?? false) : dailyQuestCompleted}
          />
          {userId && (
            <div className="mt-3">
              {dailyRewardLoading ? (
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
              )}
            </div>
          )}
          <div className="relative mt-4">
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
            onBioCardDismiss={() => setShowBioCard(false)}
            showPartnerSkeleton={showPartnerSkeleton}
            userRank={getRankFromCoinsSpent(sessionSpent)}
            onReport={handleReport}
            showReportButton={connected && !searching && !!partnerId}
          />
          <VideoFilterBar
            locale={locale}
            activeFilter={activeFilter}
            onSelectFilter={handleSelectFilter}
          />
          {searching && useRealMatching && (
            <div className="absolute left-3 top-14 z-20">
              <MatchFilterBar
                filter={matchFilter}
                onFilterChange={setMatchFilter}
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
          {connected && (
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={handleGhostModeToggle}
                className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-center text-sm font-medium transition-all ${
                  ghostMode
                    ? "bg-emerald-950/50 text-emerald-400 ring-1 ring-emerald-500/50"
                    : "border border-white/20 text-white/80 hover:bg-white/10"
                }`}
              >
                {ghostMode ? (
                  <>
                    <span className="text-[10px]">✓</span>
                    Ghost Mode
                    <span className="rounded bg-emerald-500/30 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                      Live · 1/2min
                    </span>
                  </>
                ) : (
                  <>
                    Ghost Mode
                    <span className="text-xs text-white/60">
                      (1 coin/2 min)
                    </span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleLiveTranslationToggle}
                className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-center text-sm font-medium transition-all ${
                  liveTranslationEnabled
                    ? "bg-[#8b5cf6]/30 text-[#a78bfa] ring-1 ring-[#8b5cf6]/50"
                    : "border border-white/20 text-white/80 hover:bg-white/10"
                }`}
              >
                {liveTranslationEnabled ? (
                  <>
                    <span className="text-[10px]">✓</span>
                    {t.liveTranslationActive}
                  </>
                ) : (
                  <>
                    {t.liveTranslationLabel}
                    <span className="text-xs text-white/60">
                      ({t.liveTranslationActivate})
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
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
                  className="min-h-[40px] rounded-full border border-amber-500/60 bg-amber-950/70 px-4 py-2 text-sm font-medium text-amber-400 transition-all hover:bg-amber-900/60 active:scale-[0.98] disabled:opacity-50"
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
          <ReactionBar
            locale={locale}
            coins={coins}
            onSendReaction={handleSendReaction}
            disabled={!connected || searching}
          />
          <GiftsBar locale={locale} coins={coins} onSendGift={handleSendGift} />
          </div>
        </div>
        <ChatPanel
          messages={messages}
          locale={locale}
          coins={coins}
          onRecharge={onOpenShop}
          onIcebreaker={connected && partnerId ? handleIcebreaker : undefined}
          canAffordIcebreaker={coins >= ICEBREAKER_COST}
          icebreakerCost={ICEBREAKER_COST}
          onSendMessage={connected && partnerId ? handleSendMessage : undefined}
          chatBlocked={chatBlockRemainingMs > 0}
          chatBlockedMinutes={Math.ceil(chatBlockRemainingMs / 60000)}
        />
        {commonInterestFlash && (
          <div className="absolute left-1/2 top-24 z-30 -translate-x-1/2 rounded-lg bg-amber-500/90 px-4 py-2 text-sm font-semibold text-black shadow-lg animate-in fade-in duration-300">
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
