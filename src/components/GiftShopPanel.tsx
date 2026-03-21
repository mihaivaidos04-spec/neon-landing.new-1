"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import type { ContentLocale } from "../lib/content-i18n";
import { getContentT } from "../lib/content-i18n";
import type { VideoFilterId } from "../lib/video-filters";
import { REACTIONS } from "../lib/reactions";
import type { ReactionId } from "../lib/reactions";
import { getReactionCost, getGiftCost } from "../lib/coins";
import { GIFTS } from "./GiftsBar";
import type { TheaterGiftId } from "../lib/theater-gifts";

const GIFT_DRAWER_TITLE: Partial<Record<ContentLocale, string>> = {
  en: "Gifts & video effects",
  ro: "Cadouri și efecte video",
  de: "Geschenke & Video-Effekte",
  fr: "Cadeaux & effets vidéo",
  es: "Regalos y efectos de vídeo",
  it: "Regali ed effetti video",
  pt: "Presentes e efeitos de vídeo",
  nl: "Cadeaus & video-effecten",
  pl: "Prezenty i efekty wideo",
  tr: "Hediyeler ve video efektleri",
};

type BaseProps = {
  locale: ContentLocale;
  activeFilter: VideoFilterId;
  onSelectFilter: (filter: VideoFilterId) => void;
  connected: boolean;
  searching: boolean;
  ghostMode: boolean;
  onGhostModeToggle: () => void;
  liveTranslationEnabled: boolean;
  onLiveTranslationToggle: () => void;
  coins: number;
  onSendReaction: (reactionId: ReactionId) => void;
  onSendGift: (giftId: TheaterGiftId) => void;
  /** Wrap interactions (e.g. guest → login) */
  onBeforeInteraction?: () => boolean;
};

const FILTER_OPTIONS: { id: VideoFilterId; labelKey: keyof ReturnType<typeof getContentT> }[] = [
  { id: "beauty_blur", labelKey: "videoFilterBeautyBlur" },
  { id: "noir", labelKey: "videoFilterNoir" },
  { id: "neon_glow", labelKey: "videoFilterNeonGlow" },
];

function GiftShopPanelContent({
  locale,
  activeFilter,
  onSelectFilter,
  connected,
  searching,
  ghostMode,
  onGhostModeToggle,
  liveTranslationEnabled,
  onLiveTranslationToggle,
  coins,
  onSendReaction,
  onSendGift,
  onBeforeInteraction,
  className = "",
  hideShopTitle = false,
}: BaseProps & { className?: string; hideShopTitle?: boolean }) {
  const t = getContentT(locale);
  const effectsDisabled = !connected || searching;

  const guard = useCallback(() => {
    if (onBeforeInteraction?.()) return true;
    return false;
  }, [onBeforeInteraction]);

  return (
    <div className={`flex flex-col ${className}`}>
      {!hideShopTitle && (
        <p className="mb-2 shrink-0 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-fuchsia-200/90">
          Gift shop
        </p>
      )}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden pr-0.5 [-webkit-overflow-scrolling:touch]">
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/45">Looks</p>
          <div className="flex flex-col gap-1.5">
            {FILTER_OPTIONS.map(({ id, labelKey }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  if (guard()) return;
                  onSelectFilter(activeFilter === id ? "none" : id);
                }}
                className={`min-h-[44px] rounded-xl px-3 py-2 text-left text-xs font-medium transition-all active:scale-[0.98] ${
                  activeFilter === id
                    ? "bg-[#8b5cf6] text-white shadow-[0_0_16px_rgba(139,92,246,0.5)]"
                    : "border border-white/15 bg-black/40 text-white/85 hover:bg-white/10"
                }`}
              >
                {typeof t[labelKey] === "string" ? t[labelKey] : ""}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/45">Effects</p>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (guard()) return;
                onGhostModeToggle();
              }}
              disabled={effectsDisabled}
              className={`min-h-[48px] rounded-xl px-3 py-2 text-left text-xs font-medium transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 ${
                ghostMode
                  ? "bg-emerald-950/60 text-emerald-300 ring-1 ring-emerald-500/40"
                  : "border border-white/15 bg-black/40 text-white/85 hover:bg-white/10"
              }`}
            >
              {ghostMode ? (
                <span className="flex flex-col gap-0.5">
                  <span>✓ Ghost Mode</span>
                  <span className="text-[10px] font-normal text-emerald-400/90">Live · 1/2 min</span>
                </span>
              ) : (
                <span className="flex flex-col gap-0.5">
                  <span>Ghost Mode</span>
                  <span className="text-[10px] font-normal text-white/50">1 coin / 2 min</span>
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                if (guard()) return;
                onLiveTranslationToggle();
              }}
              disabled={effectsDisabled}
              className={`min-h-[48px] rounded-xl px-3 py-2 text-left text-xs font-medium transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 ${
                liveTranslationEnabled
                  ? "bg-violet-950/60 text-violet-200 ring-1 ring-violet-500/40"
                  : "border border-white/15 bg-black/40 text-white/85 hover:bg-white/10"
              }`}
            >
              {liveTranslationEnabled ? (
                <span>✓ {t.liveTranslationActive}</span>
              ) : (
                <span className="flex flex-col gap-0.5">
                  <span>{t.liveTranslationLabel}</span>
                  <span className="text-[10px] font-normal text-white/50">{t.liveTranslationActivate}</span>
                </span>
              )}
            </button>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/45">Reactions</p>
          <div className="flex flex-wrap gap-1.5">
            {REACTIONS.map((r) => {
              const cost = getReactionCost(r.id);
              const canAfford = coins >= cost;
              return (
                <motion.button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    if (guard()) return;
                    if (canAfford && !effectsDisabled) onSendReaction(r.id);
                  }}
                  disabled={effectsDisabled || !canAfford}
                  className="flex min-h-[48px] min-w-[48px] flex-col items-center justify-center rounded-xl border border-white/12 bg-black/35 px-2 py-1.5 text-white/80 transition-all active:scale-95 disabled:opacity-45"
                  whileHover={canAfford && !effectsDisabled ? { scale: 1.05 } : {}}
                  whileTap={canAfford && !effectsDisabled ? { scale: 0.94 } : {}}
                >
                  <span className="text-lg leading-none">{r.emoji}</span>
                  <span className="text-[9px] font-medium opacity-80">{cost}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/45">Gifts</p>
          <div className="grid grid-cols-2 gap-1.5">
            {GIFTS.map((g) => {
              const cost = getGiftCost(g.id);
              const canAfford = coins >= cost;
              const isDiamond = g.id === "diamond";
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    if (guard()) return;
                    onSendGift(g.id);
                  }}
                  disabled={!canAfford}
                  className={`flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-xl border px-2 py-2 text-white transition-all active:scale-[0.96] disabled:opacity-45 ${
                    isDiamond
                      ? "gift-diamond-pulse border-fuchsia-400/50 bg-fuchsia-950/30"
                      : "border-white/15 bg-black/40 hover:bg-white/10"
                  }`}
                >
                  <span
                    className={`text-xl leading-none ${isDiamond ? "drop-shadow-[0_0_8px_rgba(236,72,153,0.9)]" : ""}`}
                  >
                    {g.emoji}
                  </span>
                  <span className="text-[9px] font-medium text-white/70">
                    {cost} {t.coinsLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Prominent gift shop card — under Daily Quest in the left rail (desktop flyout + mobile expanded).
 */
export function GiftShopQuestStack(props: BaseProps) {
  const t = getContentT(props.locale);
  const subtitle = GIFT_DRAWER_TITLE[props.locale] ?? GIFT_DRAWER_TITLE.en!;

  return (
    <section
      className="gift-shop-quest-stack flex w-full min-w-0 max-w-full flex-col overflow-hidden rounded-xl border-2 border-fuchsia-400/75 bg-gradient-to-b from-[#1c0b28]/98 via-[#100818]/98 to-[#050508] p-3 shadow-[0_0_36px_rgba(236,72,153,0.45),0_0_72px_rgba(139,92,246,0.22),inset_0_1px_0_rgba(255,255,255,0.08)] ring-1 ring-cyan-400/25 backdrop-blur-xl"
      aria-label="Gift shop and video effects"
    >
      <div className="mb-2 flex shrink-0 items-center gap-2 border-b border-fuchsia-500/35 pb-2.5">
        <span className="mystery-gift-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-600/40 to-violet-600/30 text-xl shadow-[0_0_20px_rgba(236,72,153,0.5)]">
          🎁
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-fuchsia-200">Gift shop</p>
          <p className="text-[11px] font-medium text-cyan-200/70">{subtitle}</p>
        </div>
      </div>
      <div className="min-h-0 max-h-[min(48vh,420px)] flex-1 overflow-y-auto overflow-x-hidden pr-0.5 [-webkit-overflow-scrolling:touch] sm:max-h-[min(52vh,480px)]">
        <GiftShopPanelContent {...props} hideShopTitle />
      </div>
      <p className="mt-2 shrink-0 text-center text-[10px] font-medium text-fuchsia-200/50">{t.coinsLabel}</p>
    </section>
  );
}

/**
 * @deprecated Prefer GiftShopQuestStack beside Daily Quest; kept for legacy layouts.
 */
export function GiftShopSideRail(props: BaseProps) {
  return (
    <aside className="gift-shop-side-rail hidden w-full shrink-0 xl:flex xl:w-[min(13rem,90vw)] xl:max-w-[14rem]">
      <GiftShopQuestStack {...props} />
    </aside>
  );
}

/** Mobile: collapsible block below video (scrolls with page) */
export function GiftShopMobileDrawer(props: BaseProps) {
  const [open, setOpen] = useState(false);
  const drawerTitle = GIFT_DRAWER_TITLE[props.locale] ?? GIFT_DRAWER_TITLE.en!;

  return (
    <div className="mt-3 w-full overflow-hidden rounded-2xl border border-violet-500/35 bg-black/30 backdrop-blur-md xl:hidden">
      <button
        type="button"
        onClick={() => {
          if (!open && props.onBeforeInteraction?.()) return;
          setOpen((o) => !o);
        }}
        className="flex min-h-[48px] w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold text-fuchsia-200/95"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <span className="text-lg" aria-hidden>
            🎁
          </span>
          {drawerTitle}
        </span>
        <span className="text-white/50">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="border-t border-violet-500/20 p-3">
          <div className="max-h-[55vh] overflow-y-auto rounded-xl border border-white/10 bg-black/40 p-2">
            <GiftShopPanelContent {...props} />
          </div>
        </div>
      )}
    </div>
  );
}

/** Standalone panel; pe landing folosește GiftShopQuestStack în StageLeftRail. */
export default function GiftShopPanel(props: BaseProps) {
  return (
    <div className="gift-shop-panel flex max-h-[min(48vh,380px)] w-[min(240px,90vw)] flex-col rounded-2xl border-2 border-[#a855f7]/70 bg-[#0a0a12]/95 p-2.5 shadow-[0_0_28px_rgba(168,85,247,0.45)] backdrop-blur-xl">
      <GiftShopPanelContent {...props} />
    </div>
  );
}
