"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ContentLocale } from "../lib/content-i18n";
import { getContentT } from "../lib/content-i18n";
import { useAgoraTheater } from "../hooks/useAgoraTheater";
import { createTranscriptBuffer, useNeonWhisper } from "../hooks/useNeonWhisper";
import { useJeelizMaskPipeline } from "../hooks/useJeelizMaskPipeline";
import type { FaceMaskId } from "../lib/face-masks";
import { NEON_GLASSES_COST } from "../lib/face-masks";
import type { VideoFilterId } from "../lib/video-filters";
import { getFilterCss } from "../lib/video-filters";
import SearchingSpinner from "./SearchingSpinner";
import BeautyBlurOverlay from "./BeautyBlurOverlay";
import LiveSubtitles from "./LiveSubtitles";
import NeonWhisperOverlay from "./NeonWhisperOverlay";
import ReactionOverlay from "./ReactionOverlay";
import CrownOverlay from "./CrownOverlay";
import LiveLeaderboard from "./LiveLeaderboard";
import CountrySelector from "./CountrySelector";
import GiftLayer, { type ActiveGift } from "./GiftLayer";
import BioCard from "./BioCard";
import VideoSkeletonLoader from "./VideoSkeletonLoader";
import TheaterGiftDrawer from "./TheaterGiftDrawer";
import PartnerVideoGiftOverlay, {
  type PartnerVideoGiftPayload,
} from "./PartnerVideoGiftOverlay";
import type { TheaterGiftId } from "../lib/theater-gifts";
import type { ReactionId } from "../lib/reactions";
import type { RankId } from "../lib/ranks";

function videoFullscreenLabels(locale: ContentLocale): { enter: string; exit: string } {
  if (locale === "ro") {
    return { enter: "Ecran complet", exit: "Închide ecran complet" };
  }
  return { enter: "Fullscreen", exit: "Exit fullscreen" };
}

function maskMenuLabels(locale: ContentLocale) {
  if (locale === "ro") {
    return {
      button: "Măști",
      none: "Fără",
      anonymous: "Mască anonim",
      neon: "Ochelari neon",
      beauty: "Filtru beauty",
      needCoins: "Ai nevoie de 10 monede",
      loading: "Se încarcă AR…",
    };
  }
  return {
    button: "Masks",
    none: "None",
    anonymous: "Anonymous mask",
    neon: "Neon glasses",
    beauty: "Beauty filter",
    needCoins: "You need 10 coins",
    loading: "Loading AR…",
  };
}

type Props = {
  locale: ContentLocale;
  searching: boolean;
  /** Subtle quality degradation when premium expires (1px blur) */
  connectionDegraded?: boolean;
  /** Remaining seconds for filter; when set, show violet progress bar */
  premiumSecondsLeft?: number | null;
  premiumTotal?: number;
  /** Active video filter on self-view */
  activeFilter?: VideoFilterId;
  /** Beauty Blur: show paywall overlay (free trial expired, not paid) */
  beautyBlurOverlayVisible?: boolean;
  onBeautyBlurActivate?: () => void;
  onBeautyBlurRemove?: () => void;
  beautyBlurLoading?: boolean;
  canAffordBeautyBlur?: boolean;
  /** Ghost Mode: show VIP Avatar instead of real self-view (peer sees avatar) */
  ghostMode?: boolean;
  /** Live translation: speech-to-text + translate, display as subtitles */
  liveTranslationEnabled?: boolean;
  onLiveTranslationInsufficientBalance?: () => void;
  /** Reaction overlay: current reaction to display */
  reaction?: ReactionId | null;
  onReactionComplete?: () => void;
  /** Leaderboard crown: show on partner video if partner is #1 */
  showCrownOnPartner?: boolean;
  /** Leaderboard crown: show on self-view if current user is #1 */
  showCrownOnSelf?: boolean;
  /** Leaderboard entries for overlay */
  leaderboard?: { userId: string; totalSpent: number; rank: number; isGhostModeEnabled?: boolean }[];
  /** Locale for leaderboard label */
  leaderboardLocale?: ContentLocale;
  /** Current user ID (for Go Ghost CTA in leaderboard, Invite Friends) */
  leaderboardCurrentUserId?: string | null;
  /** Open Ghost Mode checkout */
  onGoGhost?: () => void;
  /** Partner video: blur until 5s countdown or Instant Reveal */
  partnerVideoBlurred?: boolean;
  /** Seconds left until auto-reveal (5, 4, 3, 2, 1) */
  partnerVideoCountdown?: number | null;
  /** Instant Reveal: pay 1 coin to remove blur immediately */
  onInstantReveal?: () => void;
  canAffordInstantReveal?: boolean;
  onOpenShop?: () => void;
  /** Battery depleted: blur video when 0% */
  batteryDepletedBlur?: boolean;
  /** Active gift: Lottie + floating badge overlay */
  activeGift?: ActiveGift | null;
  onGiftComplete?: () => void;
  /** Spending tier: user spent >$20 in session – golden border on self-view */
  isWhale?: boolean;
  /** Partner is Whale – show discrete "You're with a Premium User" */
  partnerIsPremium?: boolean;
  /** Partner is VIP or Top Spender – animated Gold/Purple gradient border */
  partnerIsVipOrTopSpender?: boolean;
  /** Bio Card: partner interests, gifts received */
  showBioCard?: boolean;
  partnerInterests?: string[];
  partnerGiftsReceived?: number;
  partnerName?: string;
  /** Partner country for flag on bio card */
  partnerCountryCode?: string | null;
  partnerLocale?: ContentLocale;
  onBioCardDismiss?: () => void;
  /** Show skeleton during partner video load/transition */
  showPartnerSkeleton?: boolean;
  /** User rank for glow intensity (Bronze → Neon God) */
  userRank?: RankId;
  /** Quick Report: discreet button on partner video */
  onReport?: () => void;
  /** Show report button (when connected with partner) */
  showReportButton?: boolean;
  /** Theater overlay gift drawer (coin check via parent) */
  theaterGiftsEnabled?: boolean;
  theaterGiftCoins?: number;
  onTheaterGift?: (giftId: TheaterGiftId) => void | Promise<void>;
  /** Fire/Rocket: full-screen-on-partner gift from peer (Socket.io). */
  partnerVideoGift?: PartnerVideoGiftPayload | null;
  onPartnerVideoGiftComplete?: () => void;
  /** Agora: shared channel id (both peers). When set with a match, real video replaces demo loop. */
  agoraChannelName?: string | null;
  /** Agora: stable key for token UID (e.g. current user id). */
  agoraUserIdKey?: string | null;
  /** Wallet spend (Neon Glasses mask = 10 coins). */
  onSpend?: (amount: number, reason?: string) => Promise<boolean>;
  /** Logged-in: enable Neon Whisper AI wingman (local-only overlay; uses partner video + your mic transcript). */
  neonWhisperEnabled?: boolean;
  /** Brief 0.2s blur/fade when moving to next partner on mobile. */
  transitionOutActive?: boolean;
};

export default function VideoBridge({
  locale,
  searching,
  connectionDegraded,
  premiumSecondsLeft,
  premiumTotal = 120,
  activeFilter = "none",
  beautyBlurOverlayVisible = false,
  onBeautyBlurActivate,
  onBeautyBlurRemove,
  beautyBlurLoading = false,
  canAffordBeautyBlur = true,
  ghostMode = false,
  liveTranslationEnabled = false,
  onLiveTranslationInsufficientBalance,
  reaction = null,
  onReactionComplete,
  showCrownOnPartner = false,
  showCrownOnSelf = false,
  leaderboard = [],
  leaderboardLocale = locale,
  leaderboardCurrentUserId,
  onGoGhost,
  partnerVideoBlurred = false,
  partnerVideoCountdown = null,
  onInstantReveal,
  canAffordInstantReveal = false,
  onOpenShop,
  batteryDepletedBlur = false,
  activeGift = null,
  onGiftComplete,
  isWhale = false,
  partnerIsPremium = false,
  partnerIsVipOrTopSpender = false,
  showBioCard = false,
  partnerInterests = [],
  partnerGiftsReceived = 0,
  partnerName = "Partner",
  partnerCountryCode = null,
  partnerLocale = locale,
  onBioCardDismiss,
  showPartnerSkeleton = false,
  userRank = "bronze",
  onReport,
  showReportButton = false,
  theaterGiftsEnabled = false,
  theaterGiftCoins = 0,
  onTheaterGift,
  partnerVideoGift = null,
  onPartnerVideoGiftComplete,
  agoraChannelName = null,
  agoraUserIdKey = null,
  onSpend,
  neonWhisperEnabled = false,
  transitionOutActive = false,
}: Props) {
  const t = getContentT(locale);
  const fsLabels = videoFullscreenLabels(locale);
  const maskL = maskMenuLabels(locale);
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const agoraLocalRef = useRef<HTMLDivElement>(null);
  const agoraRemoteRef = useRef<HTMLDivElement>(null);
  const localPreviewVideoRef = useRef<HTMLVideoElement>(null);
  const [localPreviewStream, setLocalPreviewStream] = useState<MediaStream | null>(null);
  const [localPreviewError, setLocalPreviewError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [faceMask, setFaceMask] = useState<FaceMaskId>("none");
  const [masksMenuOpen, setMasksMenuOpen] = useState(false);
  const masksMenuRef = useRef<HTMLDivElement>(null);

  const agoraEnabled =
    Boolean(agoraChannelName?.trim()) && !searching;
  const [replacePublishTrack, setReplacePublishTrack] =
    useState<MediaStreamTrack | null>(null);

  const agora = useAgoraTheater({
    channelName: agoraChannelName?.trim() ?? null,
    enabled: agoraEnabled,
    userIdKey: agoraUserIdKey ?? "",
    localContainerRef: agoraLocalRef,
    remoteContainerRef: agoraRemoteRef,
    replaceVideoWithTrack: replacePublishTrack,
  });

  const maskPipelineEnabled = agoraEnabled && !ghostMode && agora.joined;
  const jeeliz = useJeelizMaskPipeline(
    agora.cameraMediaTrack,
    faceMask,
    maskPipelineEnabled
  );
  const transcriptBufferRef = useRef(createTranscriptBuffer());
  const pushTranscript = useCallback((text: string) => {
    transcriptBufferRef.current.push(text);
  }, []);
  const neonWhisper = useNeonWhisper({
    remoteContainerRef: agoraRemoteRef,
    active: neonWhisperEnabled && agoraEnabled && !searching && agora.hasRemoteVideo,
    transcriptBuffer: transcriptBufferRef.current,
  });

  useEffect(() => {
    const next =
      faceMask !== "none" && jeeliz.ready && jeeliz.outputVideoTrack
        ? jeeliz.outputVideoTrack
        : null;
    setReplacePublishTrack((prev) => (prev === next ? prev : next));
  }, [faceMask, jeeliz.ready, jeeliz.outputVideoTrack]);

  useEffect(() => {
    if (!agoraEnabled) {
      setReplacePublishTrack(null);
      setFaceMask("none");
      setMasksMenuOpen(false);
    }
  }, [agoraEnabled]);

  useEffect(() => {
    if (!masksMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      const el = masksMenuRef.current;
      if (el && !el.contains(e.target as Node)) setMasksMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [masksMenuOpen]);

  const handleSelectFaceMask = useCallback(
    async (id: FaceMaskId) => {
      if (id === "neon_glasses" && faceMask !== "neon_glasses") {
        if (onSpend) {
          const ok = await onSpend(NEON_GLASSES_COST, "neon_glasses");
          if (!ok) {
            onOpenShop?.();
            return;
          }
        } else if (theaterGiftCoins < NEON_GLASSES_COST) {
          onOpenShop?.();
          return;
        }
      }
      setFaceMask(id);
      setMasksMenuOpen(false);
    },
    [faceMask, theaterGiftCoins, onSpend, onOpenShop]
  );

  /** Local camera/mic when not on Agora (no duplicate device access). */
  useEffect(() => {
    if (agoraEnabled || ghostMode) {
      setLocalPreviewStream((prev) => {
        prev?.getTracks().forEach((t) => t.stop());
        return null;
      });
      setLocalPreviewError(null);
      return;
    }

    let stream: MediaStream | null = null;
    let cancelled = false;
    setLocalPreviewError(null);

    void (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        setLocalPreviewStream(stream);
      } catch (e) {
        if (!cancelled) {
          setLocalPreviewError(
            e instanceof Error ? e.message : "Camera unavailable"
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
      setLocalPreviewStream((prev) => {
        prev?.getTracks().forEach((t) => t.stop());
        return null;
      });
    };
  }, [agoraEnabled, ghostMode]);

  useEffect(() => {
    const el = localPreviewVideoRef.current;
    if (!el) return;
    el.srcObject = localPreviewStream;
    if (localPreviewStream) {
      void el.play().catch(() => {
        /* autoplay policy */
      });
    }
    return () => {
      el.srcObject = null;
    };
  }, [localPreviewStream]);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleVideoFullscreen = useCallback(async () => {
    const el = splitContainerRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      /* Safari / denied */
    }
  }, []);

  const showVipBorder = partnerIsPremium || partnerIsVipOrTopSpender;
  const rankGlowClass = userRank === "neon_god" ? "rank-glow-neon-god" : userRank === "platinum" ? "rank-glow-platinum" : userRank === "gold" ? "rank-glow-gold" : userRank === "silver" ? "rank-glow-silver" : "rank-glow-bronze";
  const showBar =
    premiumSecondsLeft != null &&
    premiumTotal > 0 &&
    premiumSecondsLeft >= 0;
  const percent = showBar ? (premiumSecondsLeft / premiumTotal) * 100 : 100;

  /** Solo layout: one full-size stage (local on main). PiP only when a remote peer is present (Agora). */
  const hideSelfPip =
    !ghostMode &&
    (searching ||
      (!agoraEnabled && Boolean(localPreviewStream)) ||
      (agoraEnabled && (!agora.joined || !agora.hasRemoteVideo)));

  const partnerFilterStyle =
    batteryDepletedBlur
      ? { filter: "blur(20px)" as const }
      : connectionDegraded
        ? { filter: "blur(1px)" as const }
        : partnerVideoBlurred
          ? { filter: "blur(12px)" as const }
          : undefined;

  return (
    <div className="h-full w-full min-h-0 overflow-visible">
      <div
        className={`video-player-wrap video-glow relative h-full min-h-0 min-w-0 w-full overflow-hidden rounded-2xl bg-black ${rankGlowClass}`}
      >
      <div
        ref={splitContainerRef}
        className={`relative h-full min-h-0 w-full overflow-hidden bg-black ${
          searching ? "aspect-video" : "aspect-auto"
        }`}
        style={{
          backgroundColor: "#000000",
          filter: transitionOutActive ? "blur(12px)" : undefined,
          opacity: transitionOutActive ? 0.2 : 1,
          transition: "filter 0.2s ease, opacity 0.2s ease",
        }}
      >
        {!searching && (
          <button
            type="button"
            onClick={() => void toggleVideoFullscreen()}
            className="absolute right-2 top-2 z-[70] flex min-h-10 items-center gap-1.5 rounded-full border border-white/20 bg-black/65 px-3 py-2 text-[11px] font-semibold text-white/95 backdrop-blur-md lg:hidden"
            aria-label={isFullscreen ? fsLabels.exit : fsLabels.enter}
          >
            {isFullscreen ? (
              <>
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="max-w-[7rem] truncate">{fsLabels.exit}</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
                <span className="max-w-[7rem] truncate">{fsLabels.enter}</span>
              </>
            )}
          </button>
        )}

        {theaterGiftsEnabled && onTheaterGift && (
          <TheaterGiftDrawer
            locale={locale}
            coins={theaterGiftCoins}
            enabled={theaterGiftsEnabled}
            onSelectGift={onTheaterGift}
          />
        )}
        <div className="pointer-events-none absolute left-2 top-2 z-30 flex max-w-[calc(100%-5rem)] flex-col gap-2">
          <div className="pointer-events-auto">
            <LiveLeaderboard leaderboard={leaderboard} locale={leaderboardLocale} currentUserId={leaderboardCurrentUserId} onGoGhost={onGoGhost} />
          </div>
          <div className="pointer-events-auto flex flex-wrap items-center gap-1.5">
            <CountrySelector userId={leaderboardCurrentUserId ?? null} compact />
          </div>
        </div>
        {/* Partner video — top jumătate pe mobil (split); umple stage pe desktop / căutare */}
        <div
          className={`relative w-full overflow-hidden transition-[filter] duration-500 ${
            searching
              ? "absolute inset-0 h-full min-h-0"
              : "absolute inset-0 h-full min-h-0"
          } ${showVipBorder ? "vip-border-glow" : ""}`}
          style={partnerFilterStyle}
        >
          {partnerVideoBlurred && (partnerVideoCountdown != null || onInstantReveal) && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/30">
              {partnerVideoCountdown != null && partnerVideoCountdown > 0 && (
                <span className="text-4xl font-bold text-white drop-shadow-lg">
                  {partnerVideoCountdown}
                </span>
              )}
              {onInstantReveal && (
                <button
                  type="button"
                  onClick={canAffordInstantReveal ? onInstantReveal : onOpenShop}
                  className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                    canAffordInstantReveal
                      ? "bg-violet-500 text-white hover:bg-violet-400"
                      : "border border-violet-500/60 text-violet-300"
                  }`}
                >
                  {t.instantRevealBtn}
                </button>
              )}
            </div>
          )}
          <CrownOverlay visible={showCrownOnPartner} position="partner" />
          {partnerIsPremium && (
            <div
              className="absolute left-3 top-12 z-20 rounded-md border border-violet-500/40 bg-violet-950/80 px-2.5 py-1.5 text-[11px] font-medium text-violet-300/95 shadow-lg max-lg:top-14"
              role="status"
            >
              You&apos;re with a Premium User
            </div>
          )}
          {showReportButton && onReport && (
            <button
              type="button"
              onClick={onReport}
              className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white/70 transition-colors hover:bg-red-500/30 hover:text-red-300 max-lg:top-12"
              title={t.reportBtn}
              aria-label={t.reportBtn}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 3h-3v2a2 2 0 01-2 2H5a2 2 0 01-2-2zm9-13.5V9" />
              </svg>
            </button>
          )}
          {showBioCard && (
            <BioCard
              partnerName={partnerName}
              partnerCountryCode={partnerCountryCode}
              locale={partnerLocale}
              interests={partnerInterests}
              totalGiftsReceived={partnerGiftsReceived}
              visible={showBioCard}
              onDismiss={onBioCardDismiss}
            />
          )}
          {showPartnerSkeleton && !agoraEnabled && <VideoSkeletonLoader />}
          {agoraEnabled ? (
            <div className="relative h-full min-h-[120px] w-full lg:min-h-0">
              <div
                ref={agoraRemoteRef}
                className="theater-agora-remote h-full min-h-[120px] w-full bg-black lg:min-h-0"
              />
              {agora.joining && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-sm text-fuchsia-200/90">
                  Connecting…
                </div>
              )}
              {agora.error && (
                <div className="absolute inset-0 z-[25] flex items-center justify-center bg-black/85 p-4 text-center text-sm text-red-300">
                  {agora.error}
                </div>
              )}
              {agora.joined &&
                !agora.hasRemoteVideo &&
                !agora.error &&
                !agora.joining && (
                  <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-[11px] text-white/80 backdrop-blur-sm">
                    Waiting for partner…
                  </div>
                )}
            </div>
          ) : (
            <>
              <video
                ref={localPreviewVideoRef}
                className="h-full min-h-[120px] w-full object-cover object-center lg:min-h-0"
                autoPlay
                muted
                playsInline
                disableRemotePlayback
                disablePictureInPicture
              />
              {localPreviewError && (
                <div className="absolute inset-0 z-[22] flex items-center justify-center bg-black/80 p-4 text-center text-sm text-white/80">
                  {localPreviewError}
                </div>
              )}
            </>
          )}
          <PartnerVideoGiftOverlay
            gift={partnerVideoGift}
            onComplete={onPartnerVideoGiftComplete ?? (() => {})}
          />
          {neonWhisperEnabled && agoraEnabled && (
            <NeonWhisperOverlay
              locale={locale}
              tip={neonWhisper.tip}
              loading={neonWhisper.loading}
              error={neonWhisper.error}
              onDismiss={neonWhisper.dismissTip}
            />
          )}
        </div>
        {/* Self-view — bottom half on mobile when connected; PiP on desktop */}
        <div
          className={`relative z-[15] overflow-hidden bg-black ${
            isWhale
              ? "border-amber-400/90 shadow-[0_0_12px_rgba(251,191,36,0.6)] lg:border-2"
              : "border-amber-500/50 lg:border-2"
          } ${hideSelfPip ? "hidden" : searching ? "max-lg:hidden" : "max-lg:absolute max-lg:bottom-3 max-lg:right-3 max-lg:h-[7.2rem] max-lg:w-[5.4rem] max-lg:rounded-lg max-lg:border-2 max-lg:shadow-[0_0_18px_rgba(0,0,0,0.45)] lg:absolute lg:bottom-3 lg:right-3 lg:h-[8.3rem] lg:w-[10.8rem] lg:shrink-0 lg:rounded-lg"}`}
        >
          <div
            className="relative h-full w-full min-h-[120px] transition-[filter] duration-300 lg:min-h-0"
            style={{
              filter: agoraEnabled
                ? undefined
                : ghostMode
                  ? getFilterCss("ghost_spy")
                  : getFilterCss(activeFilter),
            }}
          >
          <CrownOverlay visible={showCrownOnSelf} position="self" />
            {agoraEnabled ? (
              <div
                className="relative h-full w-full min-h-[120px] lg:min-h-0"
                style={{
                  filter: ghostMode
                    ? undefined
                    : getFilterCss(activeFilter),
                }}
              >
                <div
                  ref={agoraLocalRef}
                  className={
                    ghostMode
                      ? "absolute left-0 top-0 h-px w-px overflow-hidden opacity-0"
                      : "theater-agora-local h-full w-full min-h-[120px] bg-black lg:min-h-0"
                  }
                  aria-hidden={ghostMode}
                />
                {ghostMode ? (
                  <div
                    className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-violet-500/25 to-violet-900/40"
                    title="VIP Avatar"
                  >
                    <svg
                      className="h-10 w-10 text-violet-400 sm:h-12 sm:w-12"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                    </svg>
                    <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-violet-400">
                      VIP
                    </span>
                  </div>
                ) : null}
              </div>
            ) : ghostMode ? (
              <div
                className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-violet-500/25 to-violet-900/40"
                title="VIP Avatar"
              >
                <svg
                  className="h-10 w-10 text-violet-400 sm:h-12 sm:w-12"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                </svg>
                <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-violet-400">
                  VIP
                </span>
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-xs text-white/60">
                You
              </div>
            )}
            <BeautyBlurOverlay
              visible={beautyBlurOverlayVisible}
              locale={locale}
              onActivate={onBeautyBlurActivate ?? (() => {})}
              onRemove={onBeautyBlurRemove ?? (() => {})}
              loading={beautyBlurLoading}
              canAfford={canAffordBeautyBlur}
            />
          </div>
        </div>
        {agoraEnabled && agora.joined && (
          <div className="absolute bottom-3 left-1/2 z-[72] flex -translate-x-1/2 gap-2 max-lg:bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))]">
            <button
              type="button"
              onClick={agora.toggleMute}
              className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white shadow-[0_0_14px_rgba(236,72,153,0.25)] backdrop-blur-md transition hover:border-fuchsia-400/50 ${
                agora.muted ? "bg-rose-600/85 text-white" : ""
              }`}
              title={agora.muted ? "Unmute" : "Mute"}
              aria-pressed={agora.muted}
            >
              {agora.muted ? (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.35s5.42-2.35 5.91-5.35c.1-.6-.39-1.14-1-1.14z" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={agora.toggleCamera}
              className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white shadow-[0_0_14px_rgba(168,85,247,0.25)] backdrop-blur-md transition hover:border-fuchsia-400/50 ${
                agora.cameraOff ? "bg-rose-600/85 text-white" : ""
              }`}
              title={agora.cameraOff ? "Camera on" : "Camera off"}
              aria-pressed={agora.cameraOff}
            >
              {agora.cameraOff ? (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M18 10.48V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4.48l4 3.98v-11l-4 3.98zm-2-.79V18H4V6h12v3.69z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                </svg>
              )}
            </button>
            {!ghostMode && (
              <div className="relative" ref={masksMenuRef}>
                <button
                  type="button"
                  onClick={() => setMasksMenuOpen((o) => !o)}
                  className={`flex h-11 min-w-[4.5rem] items-center justify-center gap-1 rounded-full border border-white/20 bg-black/60 px-3 text-xs font-semibold text-white shadow-[0_0_14px_rgba(34,211,238,0.2)] backdrop-blur-md transition hover:border-cyan-400/50 ${
                    faceMask !== "none" ? "border-cyan-400/40 text-cyan-200" : ""
                  }`}
                  title={maskL.button}
                  aria-expanded={masksMenuOpen}
                  aria-haspopup="menu"
                >
                  <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="max-w-[4rem] truncate">{maskL.button}</span>
                </button>
                {masksMenuOpen && (
                  <div
                    className="absolute bottom-full left-1/2 z-[80] mb-2 w-[11.5rem] -translate-x-1/2 rounded-xl border border-white/15 bg-black/90 p-1.5 text-left shadow-xl backdrop-blur-md"
                    role="menu"
                  >
                    {(
                      [
                        ["none", maskL.none] as const,
                        ["anonymous", maskL.anonymous] as const,
                        ["neon_glasses", maskL.neon] as const,
                        ["beauty", maskL.beauty] as const,
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        role="menuitem"
                        onClick={() => void handleSelectFaceMask(id)}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-medium transition hover:bg-white/10 ${
                          faceMask === id ? "bg-cyan-500/20 text-cyan-200" : "text-white/90"
                        }`}
                      >
                        <span>{label}</span>
                        {id === "neon_glasses" && (
                          <span className="text-[10px] text-amber-300/90">{NEON_GLASSES_COST}🪙</span>
                        )}
                      </button>
                    ))}
                    {faceMask !== "none" && !jeeliz.ready && !jeeliz.error && (
                      <p className="px-2.5 pb-1 text-[10px] text-white/55">{maskL.loading}</p>
                    )}
                    {jeeliz.error && (
                      <p className="px-2.5 pb-1 text-[10px] text-red-300/95">{jeeliz.error}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {searching && (
          <>
            <div className="pointer-events-none absolute inset-0 z-[34] flex items-center justify-center px-6 lg:hidden">
              <div className="flex flex-col items-center gap-3">
                <div className="neon-pulse-loader" aria-hidden />
                <p
                  className="text-center text-[1.08rem] font-semibold tracking-[0.02em] text-white/94"
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.95), 0 0 16px rgba(255,255,255,0.2)" }}
                >
                  Searching for partner...
                </p>
              </div>
            </div>
            <div className="max-lg:hidden">
              <SearchingSpinner label={t.searching} />
            </div>
          </>
        )}
        <LiveSubtitles
          locale={locale}
          enabled={liveTranslationEnabled && !searching}
          listenOnly={
            neonWhisperEnabled &&
            agoraEnabled &&
            !liveTranslationEnabled &&
            !searching
          }
          onTranscriptFinal={
            neonWhisperEnabled && agoraEnabled ? pushTranscript : undefined
          }
          onInsufficientBalance={onLiveTranslationInsufficientBalance}
        />
        <ReactionOverlay
          reaction={reaction}
          onComplete={onReactionComplete ?? (() => {})}
        />
        <GiftLayer
          gift={activeGift}
          onComplete={onGiftComplete ?? (() => {})}
        />
      </div>
      {/* Thin violet progress bar: filter time remaining (relaxed, no red timers) */}
      {showBar && (
        <div
          className="h-1 w-full bg-white/10"
          role="progressbar"
          aria-valuenow={premiumSecondsLeft}
          aria-valuemin={0}
          aria-valuemax={premiumTotal}
        >
          <div
            className="h-full rounded-b transition-all duration-1000 ease-linear"
            style={{
              width: `${percent}%`,
              background: "linear-gradient(90deg, #8b5cf6 0%, #39ff14 100%)",
              boxShadow: "0 0 8px rgba(139, 92, 246, 0.5)",
            }}
          />
        </div>
      )}
      </div>
    </div>
  );
}
