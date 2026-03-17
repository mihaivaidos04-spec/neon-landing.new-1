"use client";

import type { ContentLocale } from "../lib/content-i18n";
import { getContentT } from "../lib/content-i18n";
import type { VideoFilterId } from "../lib/video-filters";
import { getFilterCss } from "../lib/video-filters";
import SearchingSpinner from "./SearchingSpinner";
import BeautyBlurOverlay from "./BeautyBlurOverlay";
import LiveSubtitles from "./LiveSubtitles";
import ReactionOverlay from "./ReactionOverlay";
import CrownOverlay from "./CrownOverlay";
import LiveLeaderboard from "./LiveLeaderboard";
import GiftLayer, { type ActiveGift } from "./GiftLayer";
import BioCard from "./BioCard";
import VideoSkeletonLoader from "./VideoSkeletonLoader";
import type { ReactionId } from "../lib/reactions";
import type { RankId } from "../lib/ranks";

const PARTNER_VIDEO =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

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
  leaderboard?: { userId: string; totalSpent: number; rank: number }[];
  /** Locale for leaderboard label */
  leaderboardLocale?: ContentLocale;
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
  onBioCardDismiss?: () => void;
  /** Show skeleton during partner video load/transition */
  showPartnerSkeleton?: boolean;
  /** User rank for glow intensity (Bronze → Neon God) */
  userRank?: RankId;
  /** Quick Report: discreet button on partner video */
  onReport?: () => void;
  /** Show report button (when connected with partner) */
  showReportButton?: boolean;
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
  onBioCardDismiss,
  showPartnerSkeleton = false,
  userRank = "bronze",
  onReport,
  showReportButton = false,
}: Props) {
  const t = getContentT(locale);
  const showVipBorder = partnerIsPremium || partnerIsVipOrTopSpender;
  const rankGlowClass = userRank === "neon_god" ? "rank-glow-neon-god" : userRank === "platinum" ? "rank-glow-platinum" : userRank === "gold" ? "rank-glow-gold" : userRank === "silver" ? "rank-glow-silver" : "rank-glow-bronze";
  const showBar =
    premiumSecondsLeft != null &&
    premiumTotal > 0 &&
    premiumSecondsLeft >= 0;
  const percent = showBar ? (premiumSecondsLeft / premiumTotal) * 100 : 100;

  return (
    <div className={`video-player-wrap video-glow relative w-full overflow-hidden rounded-xl bg-black ${rankGlowClass}`}>
      <div className="relative aspect-video w-full">
        <LiveLeaderboard leaderboard={leaderboard} locale={leaderboardLocale} />
        {/* Partner video (main) - blur when connection degraded or initial 5s; VIP gradient border */}
        <div
          className={`relative h-full w-full transition-[filter] duration-500 ${
            showVipBorder ? "vip-border-glow" : ""
          }`}
          style={
            batteryDepletedBlur
              ? { filter: "blur(20px)" }
              : connectionDegraded
                ? { filter: "blur(1px)" }
                : partnerVideoBlurred
                  ? { filter: "blur(12px)" }
                  : undefined
          }
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
                      ? "bg-amber-500 text-black hover:bg-amber-400"
                      : "border border-amber-500/60 text-amber-400"
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
              className="absolute left-3 top-12 z-20 rounded-md border border-amber-500/40 bg-amber-950/80 px-2.5 py-1.5 text-[11px] font-medium text-amber-300/95 shadow-lg"
              role="status"
            >
              You&apos;re with a Premium User
            </div>
          )}
          {showReportButton && onReport && (
            <button
              type="button"
              onClick={onReport}
              className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white/70 transition-colors hover:bg-red-500/30 hover:text-red-300"
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
              interests={partnerInterests}
              totalGiftsReceived={partnerGiftsReceived}
              visible={showBioCard}
              onDismiss={onBioCardDismiss}
            />
          )}
          {showPartnerSkeleton && <VideoSkeletonLoader />}
          <video
            className="h-full w-full object-cover"
            src={PARTNER_VIDEO}
            autoPlay
            muted
            loop
            playsInline
            disableRemotePlayback
            disablePictureInPicture
          />
        </div>
        {/* Self-view (small corner) - VIP Avatar when Ghost Mode, else "Tu"; Whale = golden border */}
        <div
          className={`absolute bottom-3 right-3 h-24 w-32 overflow-hidden rounded-lg border-2 bg-black sm:h-28 sm:w-36 ${
            isWhale
              ? "border-amber-400/90 shadow-[0_0_12px_rgba(251,191,36,0.6)]"
              : "border-[#8b5cf6]/60"
          }`}
        >
          <div
            className="relative h-full w-full transition-[filter] duration-300"
            style={{
              filter: ghostMode
                ? getFilterCss("ghost_spy")
                : getFilterCss(activeFilter),
            }}
          >
          <CrownOverlay visible={showCrownOnSelf} position="self" />
            {ghostMode ? (
              <div
                className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#8b5cf6]/30 to-[#4c1d95]/50"
                title="VIP Avatar"
              >
                <svg
                  className="h-10 w-10 text-[#a78bfa] sm:h-12 sm:w-12"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                </svg>
                <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[#a78bfa]">
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
        {searching && <SearchingSpinner label={t.searching} />}
        <LiveSubtitles
          locale={locale}
          enabled={liveTranslationEnabled && !searching}
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
              background: "linear-gradient(90deg, #8b5cf6 0%, #a78bfa 100%)",
              boxShadow: "0 0 8px rgba(139, 92, 246, 0.5)",
            }}
          />
        </div>
      )}
    </div>
  );
}
