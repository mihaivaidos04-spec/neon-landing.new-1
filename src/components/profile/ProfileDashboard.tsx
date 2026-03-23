"use client";

import type { CSSProperties } from "react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import UserNameWithFlag from "@/src/components/UserNameWithFlag";
import UserFlag from "@/src/components/UserFlag";
import { getT, getLocaleFromBrowser, isRtl, type I18nLocale } from "@/src/i18n";
import { PROFILE_BADGE_DEFINITIONS } from "@/src/lib/profile-badge-defs";
import { avatarGlowColors } from "@/src/lib/level-progress";
import { BILLING_PACKS } from "@/src/lib/billing-packs";
import { SHOP_ITEMS, type ShopItem } from "@/src/lib/shop-items";
import CharacterGallerySection from "@/src/components/profile/CharacterGallerySection";
import FuturisticGiftIcon from "@/src/components/FuturisticGiftIcon";
import ProfilePresenceBadge from "@/src/components/profile/ProfilePresenceBadge";
import ProfileFriendsTab from "@/src/components/profile/ProfileFriendsTab";
import { neonVipGlowVariant } from "@/src/lib/neon-vip-style";
import { normalizeVipTier } from "@/src/lib/vip-tier";

const ShopModal = dynamic(() => import("@/src/components/ShopModal"), { ssr: false });

function inter(tpl: string, v: Record<string, string | number>) {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => (v[k] != null ? String(v[k]) : ""));
}

function StripeCheckoutSpinnerLabel({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center justify-center gap-2">
      <span
        className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-fuchsia-400/35 border-t-pink-300 shadow-[0_0_10px_rgba(244,114,182,0.45)]"
        aria-hidden
      />
      {label}
    </span>
  );
}

type DayStat = {
  xp: number;
  logins: number;
  giftsSent: number;
  giftsReceived: number;
  globalChats: number;
};

type MeResponse = {
  nickname: string | null;
  bio: string;
  profileGender: string | null;
  profileBannerUrl: string | null;
  gallerySlots?: (string | null)[];
  lastSeenAt: string;
  isGhost: boolean;
  ghostModeUntil: string | null;
  languages: string[];
  socialInstagram: string | null;
  socialTiktok: string | null;
  socialDiscord: string | null;
  coins: number;
  totalCoinsSpent: number;
  /** Lifetime USD from Stripe (gold avatar ring when > 50) */
  totalSpent: number;
  totalGiftsReceived: number;
  giftsReceivedByType: Record<string, number>;
  countryCode: string | null;
  xp: number;
  currentLevel: number;
  levelProgress: {
    progress01: number;
    xpRemaining: number;
    nextLevel: number | null;
    nextRewardKey: string | null;
  };
  badges: { id: string; unlocked: boolean }[];
  currentStreak: number;
  streakBonusPopup: number;
  isNeonVip: boolean;
  vipTier?: string;
  animatedBanner: string | null;
  profileGifUrl: string | null;
  profileBannerEffect: string | null;
};

type Supporter = {
  userId: string;
  totalSent: number;
  name: string | null;
  image: string | null;
  countryCode?: string | null;
};

const HEATMAP_COLORS = [
  "bg-white/5",
  "bg-violet-500/20",
  "bg-violet-500/40",
  "bg-violet-500/60",
  "bg-violet-500/80",
  "bg-violet-500",
];

/** Shop gift types shown in the 4×2 trophy grid (row-major) */
const TROPHY_SHOP_ORDER = ["rose", "heart", "fire", "diamond", "rocket", "crown"] as const;

const GLASS_PANEL =
  "rounded-2xl border border-white/[0.08] bg-white/[0.05] backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_32px_rgba(0,0,0,0.35)]";

function formatRemainMs(ms: number): string {
  if (ms <= 0) return "0s";
  const sTotal = Math.floor(ms / 1000);
  const d = Math.floor(sTotal / 86400);
  const h = Math.floor((sTotal % 86400) / 3600);
  const m = Math.floor((sTotal % 3600) / 60);
  const sec = sTotal % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function GenderGlyph({ gender }: { gender: string | null | undefined }) {
  if (gender === "male") {
    return (
      <span
        className="inline-flex shrink-0"
        style={{ filter: "drop-shadow(0 0 10px rgba(56,189,248,0.85))" }}
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="h-9 w-9">
          <circle cx="11" cy="15" r="5.5" fill="none" stroke="#38bdf8" strokeWidth="1.75" />
          <path
            d="M15 11 L21 5 M21 5H17M21 5V9"
            stroke="#38bdf8"
            strokeWidth="1.75"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </span>
    );
  }
  if (gender === "female") {
    return (
      <span
        className="inline-flex shrink-0"
        style={{ filter: "drop-shadow(0 0 10px rgba(244,114,182,0.9))" }}
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="h-9 w-9">
          <circle cx="12" cy="9" r="4.75" fill="none" stroke="#f472b6" strokeWidth="1.75" />
          <path d="M12 14 V21 M8.5 17.5H15.5" stroke="#f472b6" strokeWidth="1.75" strokeLinecap="round" fill="none" />
        </svg>
      </span>
    );
  }
  if (gender === "other") {
    return (
      <span
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-violet-400/50 bg-violet-500/15 text-sm font-bold text-violet-200 shadow-[0_0_14px_rgba(167,139,250,0.45)]"
        aria-hidden
      >
        +
      </span>
    );
  }
  return (
    <span
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/30 text-[10px] text-white/35"
      aria-hidden
    >
      —
    </span>
  );
}

/** Pulsating neon avatar ring only at this level and above */
const AVATAR_NEON_PULSE_MIN_LEVEL = 5;
const VIP_MIN_COINS_SPENT = 500;
/** USD lifetime Stripe spend — gold neon avatar when above this */
const GOLD_NEON_MIN_TOTAL_SPENT_USD = 50;

const LANG_PRESETS: { code: string; flag: string; label: string }[] = [
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "ro", flag: "🇷🇴", label: "Română" },
  { code: "es", flag: "🇪🇸", label: "Español" },
  { code: "fr", flag: "🇫🇷", label: "Français" },
  { code: "de", flag: "🇩🇪", label: "Deutsch" },
  { code: "it", flag: "🇮🇹", label: "Italiano" },
  { code: "pt", flag: "🇵🇹", label: "Português" },
  { code: "ar", flag: "🇸🇦", label: "العربية" },
  { code: "id", flag: "🇮🇩", label: "Indonesia" },
  { code: "hi", flag: "🇮🇳", label: "हिन्दी" },
];

function getColorForValue(val: number, max: number): string {
  if (val <= 0) return HEATMAP_COLORS[0];
  const idx = Math.min(
    Math.ceil((val / Math.max(max, 1)) * (HEATMAP_COLORS.length - 1)),
    HEATMAP_COLORS.length - 1
  );
  return HEATMAP_COLORS[idx];
}

function SocialNeonIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-fuchsia-500/35 bg-black/40 text-fuchsia-200/90 shadow-[0_0_16px_rgba(236,72,153,0.2)] transition-all hover:border-fuchsia-400/55 hover:text-white hover:shadow-[0_0_22px_rgba(236,72,153,0.45)]"
    >
      {children}
    </a>
  );
}

export default function ProfileDashboard() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [locale, setLocale] = useState<I18nLocale>("en");
  const [me, setMe] = useState<MeResponse | null>(null);
  const [activity, setActivity] = useState<Record<string, number>>({});
  const [dayStats, setDayStats] = useState<Record<string, DayStat>>({});
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [nicknameDraft, setNicknameDraft] = useState(me?.nickname ?? "");
  const [nicknameSaving, setNicknameSaving] = useState(false);
  const [nicknameEditing, setNicknameEditing] = useState(false);
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [bioDraft, setBioDraft] = useState("");
  const [bannerDraft, setBannerDraft] = useState("");
  const [langsDraft, setLangsDraft] = useState<string[]>([]);
  const [igDraft, setIgDraft] = useState("");
  const [ttDraft, setTtDraft] = useState("");
  const [dcDraft, setDcDraft] = useState("");
  const [profileGenderDraft, setProfileGenderDraft] = useState<string | null>(null);
  const [bioEditing, setBioEditing] = useState(false);
  const [boostTick, setBoostTick] = useState(0);
  const [saving, setSaving] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [hoverTip, setHoverTip] = useState<{ x: number; y: number; text: string } | null>(null);
  const [loadErr, setLoadErr] = useState(false);
  const [bannerBroken, setBannerBroken] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "friends">("profile");
  const [gallerySlots, setGallerySlots] = useState<(string | null)[]>([null, null, null]);
  const [gifDraft, setGifDraft] = useState("");
  const [animatedBannerDraft, setAnimatedBannerDraft] = useState("");
  const [effectDraft, setEffectDraft] = useState<string>("");
  const paymentSuccessHandledRef = useRef(false);

  const t = useMemo(() => getT(locale), [locale]);
  const rtl = isRtl(locale);

  useEffect(() => setLocale(getLocaleFromBrowser()), []);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/me/sync-country", { method: "POST" })
      .then((r) => r.json())
      .then((d: { updated?: boolean }) => {
        if (d.updated) void updateSession?.();
      })
      .catch(() => {});
  }, [status, updateSession]);

  const loadMe = useCallback(() => {
    setLoadErr(false);
    return fetch("/api/profile/me")
      .then((r) => {
        if (!r.ok) throw new Error("me");
        return r.json();
      })
      .then((d: MeResponse & { error?: string }) => {
        if (d.error) throw new Error(d.error);
        setMe(d);
        setNicknameDraft(d.nickname ?? "");
        setBioDraft(d.bio ?? "");
        setProfileGenderDraft(d.profileGender ?? null);
        setBioEditing(false);
        setBannerDraft(d.profileBannerUrl ?? "");
        setLangsDraft(d.languages ?? []);
        setIgDraft(d.socialInstagram ?? "");
        setTtDraft(d.socialTiktok ?? "");
        setDcDraft(d.socialDiscord ?? "");
        setBannerBroken(false);
        if (Array.isArray(d.gallerySlots) && d.gallerySlots.length === 3) {
          setGallerySlots([d.gallerySlots[0], d.gallerySlots[1], d.gallerySlots[2]]);
        }
        setGifDraft(d.profileGifUrl ?? "");
        setAnimatedBannerDraft(d.animatedBanner ?? "");
        setEffectDraft(d.profileBannerEffect ?? "");
        if (typeof d.streakBonusPopup === "number" && d.streakBonusPopup > 0) {
          toast.success(inter(t("profile.streakBonusToast"), { n: d.streakBonusPopup }), {
            duration: 6000,
          });
        }
      })
      .catch(() => setLoadErr(true));
  }, [t]);

  useEffect(() => {
    if (searchParams.get("payment") !== "success") return;
    if (paymentSuccessHandledRef.current) return;
    paymentSuccessHandledRef.current = true;
    toast.success(t("profile.paymentSuccessToast"), { icon: "✨", duration: 5500 });
    void updateSession?.();
    void loadMe();
    router.replace("/profile", { scroll: false });
  }, [searchParams, router, loadMe, updateSession, t]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status !== "authenticated") return;

    void loadMe();
    Promise.all([
      fetch("/api/profile/activity?days=365").then((r) => r.json()),
      fetch("/api/profile/supporters").then((r) => r.json()),
    ]).then(([actRes, supRes]) => {
      if (actRes.activity) setActivity(actRes.activity);
      if (actRes.dayStats) setDayStats(actRes.dayStats);
      if (supRes.supporters) setSupporters(supRes.supporters);
    });
  }, [status, router, loadMe]);

  useEffect(() => {
    if (!me?.ghostModeUntil) return;
    const end = new Date(me.ghostModeUntil).getTime();
    if (end <= Date.now()) return;
    const id = window.setInterval(() => setBoostTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [me?.ghostModeUntil]);

  const saveNickname = async () => {
    setNicknameSaving(true);
    try {
      const res = await fetch("/api/user/nickname", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nicknameDraft }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data?.error === "string" ? data.error : "Save failed");
        return;
      }
      toast.success(t("profile.nicknameSaved"));
      await loadMe();
      void updateSession?.();
    } catch {
      toast.error("Save failed");
    } finally {
      setNicknameSaving(false);
    }
  };

  const saveProfile = async () => {
    if (!me) return;
    setSaving(true);
    try {
      const res = await fetch("/api/profile/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: bioDraft,
          profileGender: profileGenderDraft,
          profileBannerUrl: bannerDraft.trim() || null,
          languages: langsDraft,
          socialInstagram: igDraft.trim() || null,
          socialTiktok: ttDraft.trim() || null,
          socialDiscord: dcDraft.trim() || null,
          ...(me.isNeonVip ? { profileGifUrl: gifDraft.trim() || null } : {}),
          ...((me.currentLevel ?? 0) >= 5
            ? {
                animatedBanner: animatedBannerDraft.trim() || null,
                profileBannerEffect: effectDraft.trim() || null,
              }
            : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Save failed");
        return;
      }
      toast.success(t("profile.saved"));
      await loadMe();
      void updateSession?.();
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const buyCoins = async () => {
    const starter = BILLING_PACKS[0];
    setBuyLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: starter.priceUsd, coinsAmount: starter.coins }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Checkout failed");
        return;
      }
      if (data.url) {
        window.location.href = data.url as string;
        return;
      }
      toast.error("No checkout URL");
    } catch {
      toast.error("Network error");
    } finally {
      setBuyLoading(false);
    }
  };

  const saveBioAndGender = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: bioDraft,
          profileGender: profileGenderDraft,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Save failed");
        return;
      }
      toast.success(t("profile.saved"));
      setBioEditing(false);
      await loadMe();
      void updateSession?.();
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleLang = (code: string) => {
    setLangsDraft((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code].slice(0, 12)
    );
  };

  const trophyShopItems = useMemo(
    () => TROPHY_SHOP_ORDER.map((id) => SHOP_ITEMS.find((i) => i.id === id)).filter(Boolean) as ShopItem[],
    []
  );

  const dates: string[] = useMemo(() => {
    const out: string[] = [];
    for (let i = 364; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      out.push(d.toISOString().slice(0, 10));
    }
    return out;
  }, []);

  const myUserId = useMemo(() => {
    if (status !== "authenticated") return null;
    const s = session as { userId?: string; user?: { id?: string } };
    return s.userId ?? s.user?.id ?? null;
  }, [session, status]);

  const maxVal = Math.max(...Object.values(activity), 1);
  const weeks = 53;
  const grid = dates.map((d) => ({ date: d, val: activity[d] ?? 0 }));

  const buildHeatmapTooltip = (date: string): string => {
    const st = dayStats[date];
    if (!st || (st.xp <= 0 && st.logins + st.giftsSent + st.giftsReceived + st.globalChats === 0)) {
      return `${date}\n${t("profile.heatmapQuiet")}`;
    }
    const parts: string[] = [date];
    if (st.xp > 0) parts.push(inter(t("profile.heatmapXp"), { n: st.xp }));
    if (st.logins > 0) parts.push(inter(t("profile.heatmapLogins"), { n: st.logins }));
    if (st.giftsSent > 0) parts.push(inter(t("profile.heatmapGiftsSent"), { n: st.giftsSent }));
    if (st.giftsReceived > 0) parts.push(inter(t("profile.heatmapGiftsReceived"), { n: st.giftsReceived }));
    if (st.globalChats > 0) parts.push(inter(t("profile.heatmapChats"), { n: st.globalChats }));
    return parts.join("\n");
  };

  const currentLevel = me?.currentLevel ?? (session as { currentLevel?: number })?.currentLevel ?? 1;
  const xp = me?.xp ?? (session as { xp?: number })?.xp ?? 0;
  const glow = avatarGlowColors(currentLevel);
  const progress = me?.levelProgress;
  const totalSpentUsd = me?.totalSpent ?? 0;
  const isGoldSpendRing = totalSpentUsd > GOLD_NEON_MIN_TOTAL_SPENT_USD;
  const useLevelNeonPulse = !isGoldSpendRing && currentLevel >= AVATAR_NEON_PULSE_MIN_LEVEL;
  const spendVipTier = normalizeVipTier(me?.vipTier);
  const avatarOuterClass =
    spendVipTier === "gold"
      ? "vip-profile-avatar-gold-tier-wrap"
      : spendVipTier === "silver"
        ? "vip-profile-avatar-silver-wrap"
        : spendVipTier === "bronze"
          ? "vip-profile-avatar-bronze-wrap"
          : isGoldSpendRing
            ? "profile-avatar-gold-neon-wrap"
            : useLevelNeonPulse
              ? "profile-avatar-neon-wrap"
              : "profile-avatar-static-ring";

  if (status === "loading" || (status === "authenticated" && !me && !loadErr)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050508] text-white">
        <span className="animate-pulse">{t("common.loading")}</span>
      </div>
    );
  }

  if (status === "authenticated" && loadErr && !me) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#050508] text-white">
        <p className="text-white/70">Could not load profile.</p>
        <button
          type="button"
          onClick={() => void loadMe()}
          className="rounded-full border border-violet-500/50 px-5 py-2 text-violet-300"
        >
          Retry
        </button>
      </div>
    );
  }

  if (status !== "authenticated" || !me) {
    return null;
  }

  const milestoneLine =
    progress && progress.nextLevel && progress.nextRewardKey && progress.xpRemaining > 0
      ? inter(t("profile.xpToNext"), {
          n: progress.xpRemaining,
          reward: t(progress.nextRewardKey),
        })
      : t("profile.xpMaxLevel");

  void boostTick;
  const ghostEndMs = me.ghostModeUntil ? new Date(me.ghostModeUntil).getTime() : null;
  const ghostCountdownActive = ghostEndMs != null && ghostEndMs > Date.now();
  const ghostBoostActive = me.isGhost || ghostCountdownActive;
  const ghostRemainStr =
    ghostCountdownActive && ghostEndMs != null ? formatRemainMs(ghostEndMs - Date.now()) : null;
  const vipBorderActive =
    totalSpentUsd > GOLD_NEON_MIN_TOTAL_SPENT_USD || (me.totalCoinsSpent ?? 0) >= VIP_MIN_COINS_SPENT;
  const showActiveBoostsCard = ghostBoostActive || vipBorderActive;

  const bannerEffectLayer =
    (me.currentLevel ?? 0) >= 5 && effectDraft === "matrix"
      ? "profile-banner-effect-matrix"
      : (me.currentLevel ?? 0) >= 5 && effectDraft === "waves"
        ? "profile-banner-effect-waves"
        : (me.currentLevel ?? 0) >= 5 && effectDraft === "stars"
          ? "profile-banner-effect-stars"
          : "";

  const sessionVip = session as { isNeonVip?: boolean; neonVipGlow?: "gold" | "blue" };
  const profileNeonGlow: false | "gold" | "blue" =
    sessionVip.isNeonVip || me.isNeonVip
      ? sessionVip.neonVipGlow ?? (myUserId ? neonVipGlowVariant(myUserId) : "gold")
      : false;

  return (
    <div className="min-h-screen bg-[#050508] text-[#faf5eb]" dir={rtl ? "rtl" : "ltr"}>
      {hoverTip && (
        <div
          className="pointer-events-none fixed z-[100] max-w-[240px] whitespace-pre-wrap rounded-lg border border-violet-500/40 bg-black/90 px-3 py-2 text-xs text-white/90 shadow-xl backdrop-blur-md"
          style={{ left: hoverTip.x + 12, top: hoverTip.y + 12 }}
        >
          {hoverTip.text}
        </div>
      )}

      {/* Customizable cover banner */}
      <div className="relative border-b border-violet-500/20 shadow-[0_0_40px_rgba(139,92,246,0.08)]">
        <div className="relative mx-auto max-w-3xl px-4 pt-3 sm:pt-4">
          <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300/70 sm:text-left">
            {t("profile.coverBannerLabel")}
          </p>
        </div>
        <div className="relative h-36 w-full overflow-hidden sm:h-44 md:h-52 sm:mx-auto sm:max-w-3xl sm:px-4 sm:pb-4">
          <div className="relative h-full overflow-hidden rounded-xl border border-white/10 bg-black/40 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.15)] sm:rounded-2xl">
            {/* Animated base + optional premium layers */}
            {!(bannerDraft.trim() && !bannerBroken) && (
              <>
                <div
                  className={`absolute inset-0 ${animatedBannerDraft.trim() ? "bg-black" : "profile-banner-default-motion"}`}
                  aria-hidden
                />
                {animatedBannerDraft.trim() ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={animatedBannerDraft.trim()}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-85"
                  />
                ) : (
                  <div className="profile-banner-mesh-fallback absolute inset-0 opacity-60 mix-blend-soft-light" aria-hidden />
                )}
                {bannerEffectLayer ? (
                  <div className={`absolute inset-0 z-[1] ${bannerEffectLayer}`} aria-hidden />
                ) : null}
              </>
            )}
            {bannerDraft.trim() && !bannerBroken ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={bannerDraft.trim()}
                alt=""
                className="relative z-[2] h-full w-full object-cover"
                onError={() => setBannerBroken(true)}
              />
            ) : null}
            <div className="absolute inset-0 z-[3] bg-gradient-to-t from-[#050508] via-[#050508]/65 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-24 bg-gradient-to-t from-[#050508]/90 to-transparent" />
            <button
              type="button"
              onClick={() =>
                document.getElementById("profile-cover-url")?.scrollIntoView({ behavior: "smooth", block: "center" })
              }
              className="absolute bottom-3 right-3 z-20 rounded-full border border-fuchsia-500/40 bg-black/55 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-fuchsia-100 shadow-[0_0_18px_rgba(236,72,153,0.25)] backdrop-blur-md transition hover:border-fuchsia-400/60 hover:bg-black/70 sm:right-7"
            >
              {t("profile.customizeCover")}
            </button>
          </div>
        </div>
      </div>

      <div
        className={`relative z-10 mx-auto max-w-3xl px-4 pt-0 ${activeTab === "profile" ? "pb-28 sm:pb-16" : "pb-16"}`}
      >
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mb-4 mt-4 text-sm text-violet-400 hover:text-violet-300"
        >
          ← Back
        </button>

        <h1 className="mb-3 text-2xl font-bold" style={{ fontFamily: "var(--font-syne), system-ui" }}>
          {t("profile.title")}
        </h1>

        <div className="mb-8 flex gap-2 border-b border-white/10 pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`rounded-t-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === "profile"
                ? "border-b-2 border-fuchsia-500 text-fuchsia-200"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            {t("profile.profileTab")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("friends")}
            className={`rounded-t-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === "friends"
                ? "border-b-2 border-fuchsia-500 text-fuchsia-200"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            {t("profile.friendsTab")}
          </button>
        </div>

        {/* Header: avatar + name + badges */}
        <div className="-mt-16 mb-8 flex flex-col gap-4 sm:-mt-20 sm:flex-row sm:items-end">
          <div
            className={`shrink-0 ${avatarOuterClass}`}
            style={
              isGoldSpendRing || spendVipTier !== "free"
                ? undefined
                : ({
                    "--profile-glow-from": glow.from,
                    "--profile-glow-to": glow.to,
                    "--profile-glow-mid": glow.from,
                    "--profile-glow-edge": glow.to,
                  } as CSSProperties)
            }
          >
            {me.isNeonVip && gifDraft.trim() ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={gifDraft.trim()}
                alt=""
                width={112}
                height={112}
                className="h-28 w-28 rounded-full border-2 border-black/80 bg-black object-cover"
              />
            ) : session?.user?.image ? (
              <Image
                src={session.user.image}
                alt=""
                width={112}
                height={112}
                className="rounded-full border-2 border-black/80 bg-black object-cover"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-black/80 bg-violet-950 text-3xl text-violet-300">
                ?
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <UserNameWithFlag
                name={session?.user?.name ?? session?.user?.email ?? "User"}
                countryCode={session?.countryCode ?? me.countryCode ?? null}
                locale={locale}
                nameClassName="text-xl font-bold sm:text-2xl"
                neonVipGlow={profileNeonGlow || false}
                vipTier={me.vipTier}
                profileUserId={myUserId ?? ""}
              />
              <span
                className="inline-flex shrink-0 items-center gap-0.5 text-sm font-bold tabular-nums text-[var(--color-text-secondary)]"
                title={t("profile.streakTooltip")}
              >
                <span aria-hidden>🔥</span>
                {me.currentStreak ?? 0}
              </span>
              {spendVipTier === "bronze" && (
                <span className="text-lg leading-none" title="VIP Bronze" aria-hidden>
                  👑
                </span>
              )}
              {spendVipTier === "silver" && (
                <span className="text-lg leading-none" title="VIP Silver" aria-hidden>
                  💎
                </span>
              )}
              {spendVipTier === "gold" && (
                <>
                  <span className="text-lg leading-none" title="VIP Gold" aria-hidden>
                    🌟
                  </span>
                  <span className="inline-flex shrink-0 items-center rounded border border-amber-400/60 bg-gradient-to-r from-amber-500/30 to-yellow-400/25 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-amber-100 shadow-[0_0_12px_rgba(251,191,36,0.45)]">
                    GOLD
                  </span>
                </>
              )}
              {me.isNeonVip && (
                <span className="inline-flex shrink-0 items-center rounded-md border border-sky-400/50 bg-sky-500/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-sky-100 shadow-[0_0_14px_rgba(56,189,248,0.4)]">
                  {t("profile.neonVipBadge")}
                </span>
              )}
              {(me.totalCoinsSpent ?? 0) > VIP_MIN_COINS_SPENT && (
                <span
                  className="inline-flex shrink-0 items-center rounded-md border border-amber-400/55 bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-amber-500/25 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-100 shadow-[0_0_14px_rgba(251,191,36,0.45)]"
                  title={t("profile.vipBadgeTitle")}
                >
                  {t("profile.vipBadge")}
                </span>
              )}
            </div>
            {myUserId && (
              <div className="mt-2 space-y-1">
                <ProfilePresenceBadge
                  userId={myUserId}
                  lastSeenAtIso={me.lastSeenAt ?? new Date().toISOString()}
                  isSelf
                />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] text-white/45">{t("profile.yourUserId")}</span>
                  <code className="max-w-full truncate rounded border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] text-violet-200/90">
                    {myUserId}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard?.writeText(myUserId);
                      toast.success(t("profile.idCopied"));
                    }}
                    className="text-[10px] font-semibold uppercase tracking-wide text-fuchsia-400 hover:text-fuchsia-300"
                  >
                    {t("profile.copyUserId")}
                  </button>
                </div>
              </div>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-fuchsia-300/80">
                {t("profile.badges")}
              </span>
              {PROFILE_BADGE_DEFINITIONS.map((def) => {
                const b = me.badges.find((x) => x.id === def.id);
                const unlocked = b?.unlocked ?? false;
                return (
                  <span
                    key={def.id}
                    title={unlocked ? t(def.descKey) : t("profile.badgeLocked")}
                    className={`cursor-default rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition-all ${
                      unlocked
                        ? "border-fuchsia-500/50 bg-fuchsia-950/50 text-fuchsia-200 shadow-[0_0_12px_rgba(236,72,153,0.25)] hover:border-fuchsia-400/70 hover:shadow-[0_0_18px_rgba(236,72,153,0.4)]"
                        : "border-white/10 bg-black/40 text-white/35"
                    }`}
                  >
                    {t(def.labelKey)}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {activeTab === "friends" && <ProfileFriendsTab t={t} />}

        {activeTab === "profile" && (
          <>
        {/* Video chat display name */}
        <section className={`mb-8 p-5 sm:p-6 ${GLASS_PANEL}`}>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-violet-300">
            {t("profile.videoNickname")}
          </h2>
          <p className="mb-4 text-xs text-white/55">{t("profile.videoNicknameHint")}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <input
              type="text"
              maxLength={20}
              value={nicknameDraft}
              onChange={(e) => setNicknameDraft(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-fuchsia-500/45 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/30 sm:max-w-md"
              placeholder="NeonUser_42"
              autoComplete="username"
            />
            <button
              type="button"
              disabled={nicknameSaving || nicknameDraft.trim().length < 3}
              onClick={() => void saveNickname()}
              className="shrink-0 rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_16px_rgba(168,85,247,0.35)] disabled:opacity-45"
            >
              {nicknameSaving ? t("profile.saving") : t("profile.saveNickname")}
            </button>
          </div>
        </section>

        {/* Level / XP bar */}
        <section className={`mb-8 p-5 ${GLASS_PANEL} ring-1 ring-violet-500/20`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-medium text-violet-200">
              {t("profile.level")} {currentLevel}
              <span className="text-white/50"> · </span>
              {xp} {t("profile.xp")}
            </p>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/50 ring-1 ring-violet-500/30">
            <div
              className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 shadow-[0_0_14px_rgba(168,85,247,0.7)] transition-[width] duration-500"
              style={{ width: `${Math.round((progress?.progress01 ?? 0) * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-white/55">{milestoneLine}</p>
        </section>

        {/* About + social + languages */}
        <section className={`mb-8 p-5 sm:p-6 ${GLASS_PANEL}`}>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-violet-300">
            {t("profile.aboutMe")}
          </h2>

          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex shrink-0 flex-col items-center gap-2 sm:items-start">
              <UserFlag code={me.countryCode} locale={locale} size="lg" className="rounded-md shadow-lg" />
              <div className="flex flex-col items-center gap-1 sm:items-start">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
                  {t("profile.genderLabel")}
                </span>
                <GenderGlyph gender={bioEditing ? profileGenderDraft : me.profileGender} />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-start justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-fuchsia-300/70">
                  {t("profile.bioLabel")}
                </p>
                {!bioEditing ? (
                  <button
                    type="button"
                    onClick={() => setBioEditing(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-black/35 px-2.5 py-1.5 text-xs font-semibold text-fuchsia-200/90 shadow-[0_0_12px_rgba(236,72,153,0.15)] transition hover:border-fuchsia-500/40 hover:text-white"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {t("profile.editBio")}
                  </button>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBioDraft(me.bio ?? "");
                        setProfileGenderDraft(me.profileGender ?? null);
                        setBioEditing(false);
                      }}
                      className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/5"
                    >
                      {t("profile.cancelBioEdit")}
                    </button>
                    <button
                      type="button"
                      onClick={() => void saveBioAndGender()}
                      disabled={saving}
                      className="rounded-lg bg-gradient-to-r from-fuchsia-600 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_0_16px_rgba(168,85,247,0.35)] disabled:opacity-50"
                    >
                      {saving ? t("profile.saving") : t("profile.saveBio")}
                    </button>
                  </div>
                )}
              </div>
              {!bioEditing ? (
                <p className="min-h-[3rem] whitespace-pre-wrap text-sm leading-relaxed text-white/85">
                  {(me.bio || "").trim() ? me.bio : t("profile.aboutPlaceholder")}
                </p>
              ) : (
                <>
                  <textarea
                    value={bioDraft}
                    onChange={(e) => setBioDraft(e.target.value.slice(0, 150))}
                    rows={3}
                    maxLength={150}
                    placeholder={t("profile.aboutPlaceholder")}
                    className="w-full resize-none rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-fuchsia-500/45 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/30"
                  />
                  <p className="mt-1 text-[11px] text-white/40">
                    {inter(t("profile.charsLeft"), { n: 150 - bioDraft.length })}
                  </p>
                  <p className="mb-2 mt-4 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                    {t("profile.genderLabel")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ["male", t("profile.genderMale")],
                        ["female", t("profile.genderFemale")],
                        ["other", t("profile.genderOther")],
                      ] as const
                    ).map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setProfileGenderDraft(val)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                          profileGenderDraft === val
                            ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-100 shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                            : "border-white/15 bg-black/30 text-white/60 hover:border-white/25"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setProfileGenderDraft(null)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        profileGenderDraft === null
                          ? "border-white/30 bg-white/10 text-white"
                          : "border-white/15 bg-black/30 text-white/50 hover:border-white/25"
                      }`}
                    >
                      {t("profile.genderUnset")}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <CharacterGallerySection
            slots={gallerySlots}
            onSlotsChange={setGallerySlots}
            labels={{
              title: t("profile.galleryTitle"),
              hint: t("profile.galleryHint"),
              upload: t("profile.galleryUpload"),
            }}
          />

          <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-violet-300/90">
            {t("profile.bannerPlaceholder")}
          </p>
          <input
            id="profile-cover-url"
            type="url"
            value={bannerDraft}
            onChange={(e) => {
              setBannerDraft(e.target.value);
              setBannerBroken(false);
            }}
            placeholder="https://…"
            className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-fuchsia-500/45 focus:outline-none"
          />

          {me.isNeonVip && (
            <div className="mt-5">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-300/90">
                {t("profile.neonVipGifTitle")}
              </h3>
              <p className="mb-2 text-[11px] text-white/45">{t("profile.neonVipGifHint")}</p>
              <input
                type="url"
                value={gifDraft}
                onChange={(e) => setGifDraft(e.target.value)}
                placeholder="https://…/avatar.gif"
                className="w-full rounded-xl border border-amber-500/25 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-amber-400/45 focus:outline-none"
              />
            </div>
          )}

          {(me.currentLevel ?? 0) >= 5 && (
            <>
              <h3 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-cyan-300/90">
                {t("profile.animatedBannerUrl")}
              </h3>
              <input
                type="url"
                value={animatedBannerDraft}
                onChange={(e) => setAnimatedBannerDraft(e.target.value)}
                placeholder="https://… (GIF / image)"
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-fuchsia-500/45 focus:outline-none"
              />
              <h3 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wider text-cyan-300/90">
                {t("profile.bannerMotionEffect")}
              </h3>
              <select
                value={effectDraft}
                onChange={(e) => setEffectDraft(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white focus:border-fuchsia-500/45 focus:outline-none"
              >
                <option value="">{t("profile.bannerEffectDefault")}</option>
                <option value="matrix">{t("profile.bannerEffectMatrix")}</option>
                <option value="waves">{t("profile.bannerEffectWaves")}</option>
                <option value="stars">{t("profile.bannerEffectStars")}</option>
              </select>
            </>
          )}

          <h3 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-violet-300/90">
            {t("profile.locationLanguages")}
          </h3>
          <p className="mb-2 text-sm text-white/60">{t("profile.languages")}</p>
          <div className="flex flex-wrap gap-2">
            {LANG_PRESETS.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => toggleLang(l.code)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                  langsDraft.includes(l.code)
                    ? "border-fuchsia-500/60 bg-fuchsia-950/40 text-fuchsia-100"
                    : "border-white/15 bg-black/30 text-white/55 hover:border-white/25"
                }`}
              >
                <span className="mr-1">{l.flag}</span>
                {l.label}
              </button>
            ))}
          </div>

          <h3 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-violet-300/90">
            {t("profile.socialLinks")}
          </h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              type="url"
              value={igDraft}
              onChange={(e) => setIgDraft(e.target.value)}
              placeholder="Instagram URL"
              className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/35"
            />
            <input
              type="url"
              value={ttDraft}
              onChange={(e) => setTtDraft(e.target.value)}
              placeholder="TikTok URL"
              className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/35"
            />
            <input
              type="url"
              value={dcDraft}
              onChange={(e) => setDcDraft(e.target.value)}
              placeholder="Discord invite URL"
              className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/35"
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {(igDraft || me.socialInstagram) && (igDraft || me.socialInstagram)?.startsWith("http") && (
              <SocialNeonIcon href={igDraft || me.socialInstagram!} label="Instagram">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </SocialNeonIcon>
            )}
            {(ttDraft || me.socialTiktok) && (ttDraft || me.socialTiktok)?.startsWith("http") && (
              <SocialNeonIcon href={ttDraft || me.socialTiktok!} label="TikTok">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                </svg>
              </SocialNeonIcon>
            )}
            {(dcDraft || me.socialDiscord) && (dcDraft || me.socialDiscord)?.startsWith("http") && (
              <SocialNeonIcon href={dcDraft || me.socialDiscord!} label="Discord">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
                </svg>
              </SocialNeonIcon>
            )}
          </div>

          <button
            type="button"
            onClick={() => void saveProfile()}
            disabled={saving}
            className="mt-6 min-h-11 rounded-full bg-gradient-to-r from-fuchsia-600 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(168,85,247,0.4)] transition hover:opacity-95 disabled:opacity-50"
          >
            {saving ? t("profile.saving") : t("profile.saveProfile")}
          </button>
        </section>

        {/* Heatmap */}
        <section className="mb-10">
          <h2 className="mb-1 text-lg font-semibold text-violet-300">{t("profile.activityHeatmap")}</h2>
          <p className="mb-4 text-xs text-white/45">{t("profile.heatmapHint")}</p>
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5 p-4">
            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${weeks}, minmax(8px, 1fr))`,
                width: "fit-content",
              }}
            >
              {grid.map((cell) => (
                <div
                  key={cell.date}
                  role="presentation"
                  className={`h-3 w-3 min-w-[12px] cursor-crosshair rounded-sm transition-colors ${getColorForValue(cell.val, maxVal)}`}
                  onMouseEnter={(e) =>
                    setHoverTip({ x: e.clientX, y: e.clientY, text: buildHeatmapTooltip(cell.date) })
                  }
                  onMouseMove={(e) =>
                    setHoverTip((h) => (h ? { ...h, x: e.clientX, y: e.clientY } : h))
                  }
                  onMouseLeave={() => setHoverTip(null)}
                />
              ))}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/50">
              <span>{t("profile.legendLess")}</span>
              {HEATMAP_COLORS.map((c, i) => (
                <div key={i} className={`h-3 w-3 rounded-sm ${c}`} />
              ))}
              <span>{t("profile.legendMore")}</span>
            </div>
          </div>
        </section>

        {/* Wallet, active boosts & trophy grid */}
        <section className={`mb-10 p-5 sm:p-6 ${GLASS_PANEL}`}>
          <div className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-violet-200">{t("profile.myTrophies")}</h2>
              <p className="mt-1 max-w-md text-sm text-white/50">{t("profile.receivedGiftsSubtitle")}</p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[200px]">
              <button
                type="button"
                onClick={() => void buyCoins()}
                disabled={buyLoading}
                className="min-h-11 w-full rounded-full border border-amber-400/50 bg-gradient-to-r from-amber-500/25 to-yellow-500/20 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-amber-100 shadow-[0_0_22px_rgba(251,191,36,0.35)] transition hover:border-amber-300/60 hover:shadow-[0_0_28px_rgba(251,191,36,0.5)] disabled:opacity-50"
              >
                {buyLoading ? (
                  <StripeCheckoutSpinnerLabel label={t("profile.buyCoinsLoading")} />
                ) : (
                  t("profile.addCoinsCta")
                )}
              </button>
              <button
                type="button"
                onClick={() => setShopOpen(true)}
                className="min-h-10 w-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 px-4 py-2 text-xs font-bold text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] transition hover:opacity-95"
              >
                {t("profile.openNeonShop")}
              </button>
            </div>
          </div>

          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-amber-500/20 bg-black/25 p-4 backdrop-blur-md">
              <div className="flex items-center gap-2 text-amber-200/90">
                <span className="text-xl" aria-hidden>
                  🪙
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-100/80">
                  {t("profile.currentCoins")}
                </span>
              </div>
              <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--color-text-secondary)]">
                {me.coins.toLocaleString("en-US")}
              </p>
            </div>
            <div className="rounded-xl border border-fuchsia-500/20 bg-black/25 p-4 backdrop-blur-md">
              <div className="flex items-center gap-2 text-fuchsia-200/90">
                <FuturisticGiftIcon size={24} animate={false} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-100/80">
                  {t("profile.totalGiftsReceived")}
                </span>
              </div>
              <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--color-text-secondary)]">
                {me.totalGiftsReceived.toLocaleString("en-US")}
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-white/45">{t("profile.inventoryHint")}</p>
            </div>
          </div>

          {showActiveBoostsCard && (
            <div className="mb-6 rounded-xl border border-cyan-500/25 bg-gradient-to-br from-cyan-950/20 to-black/40 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200/90">
                {t("profile.activeBoosts")}
              </h3>
              <ul className="mt-3 space-y-3">
                {ghostBoostActive && (
                  <li className="flex flex-col gap-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm font-semibold text-white/90">{t("profile.boostGhost")}</span>
                    <span className="text-xs tabular-nums text-cyan-200/90">
                      {ghostRemainStr
                        ? inter(t("profile.boostExpiresIn"), { t: ghostRemainStr })
                        : t("profile.boostActiveIndefinite")}
                    </span>
                  </li>
                )}
                {vipBorderActive && (
                  <li className="flex flex-col gap-1 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm font-semibold text-amber-100/95">{t("profile.boostVipBorder")}</span>
                    <span className="text-xs text-amber-200/80">{t("profile.boostVipNoExpiry")}</span>
                  </li>
                )}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {trophyShopItems.map((item) => {
              const count = me.giftsReceivedByType[item.id] ?? 0;
              const has = count > 0;
              return (
                <div
                  key={item.id}
                  title={`${t(`shop.${item.nameKey}`)} — ${inter(t("profile.receivedCount"), { n: count })}`}
                  className={`flex flex-col items-center rounded-xl border px-2 py-3 text-center transition sm:px-3 sm:py-4 ${
                    has
                      ? "border-fuchsia-500/40 bg-fuchsia-950/20 shadow-[0_0_20px_rgba(236,72,153,0.25)]"
                      : "border-white/[0.06] bg-black/20 opacity-80"
                  }`}
                >
                  <span
                    className={`text-2xl sm:text-4xl ${
                      has
                        ? "drop-shadow-[0_0_18px_rgba(236,72,153,0.75)]"
                        : "opacity-40 grayscale"
                    }`}
                    aria-hidden
                  >
                    {item.icon}
                  </span>
                  <span
                    className={`mt-1.5 line-clamp-2 min-h-[2rem] text-[10px] font-medium leading-tight sm:text-xs ${
                      has ? "text-fuchsia-100/95" : "text-white/35"
                    }`}
                  >
                    {t(`shop.${item.nameKey}`)}
                  </span>
                  <span
                    className={`mt-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums sm:text-sm ${
                      has
                        ? "bg-fuchsia-500/30 text-fuchsia-50 ring-1 ring-fuchsia-400/50"
                        : "bg-black/50 text-white/35"
                    }`}
                  >
                    ×{count}
                  </span>
                </div>
              );
            })}
            <div
              className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-2 py-3 text-center opacity-50 sm:py-4"
              aria-hidden
            >
              <span className="text-lg text-white/25">✦</span>
            </div>
            <div
              className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-2 py-3 text-center opacity-50 sm:py-4"
              aria-hidden
            >
              <span className="text-lg text-white/25">✦</span>
            </div>
          </div>
        </section>

        {/* Supporters */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-violet-300">{t("profile.topSupporters")}</h2>
          {supporters.length === 0 ? (
            <p className="text-white/50">{t("profile.noSupporters")}</p>
          ) : (
            <div className="space-y-3">
              {supporters.map((s, i) => (
                <div
                  key={s.userId}
                  className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <span className="text-lg font-bold text-violet-400">#{i + 1}</span>
                  {s.image ? (
                    <Image src={s.image} alt="" width={40} height={40} className="rounded-full" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-violet-500/30" />
                  )}
                  <span className="min-w-0 flex-1 font-medium">
                    <UserNameWithFlag
                      name={s.name ?? "Anonymous"}
                      countryCode={s.countryCode ?? null}
                      locale={locale}
                      nameClassName="font-medium"
                    />
                  </span>
                  <span className="text-violet-400">{s.totalSent} coins</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-center border-t border-white/10 bg-[#050508]/90 px-4 py-3 shadow-[0_-8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:hidden">
          <button
            type="button"
            onClick={() => void buyCoins()}
            disabled={buyLoading}
            className="min-h-11 w-full max-w-md rounded-full border border-amber-400/50 bg-gradient-to-r from-amber-500/30 to-yellow-500/25 px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-amber-50 shadow-[0_0_24px_rgba(251,191,36,0.4)] disabled:opacity-50"
          >
            {buyLoading ? (
              <StripeCheckoutSpinnerLabel label={t("profile.buyCoinsLoading")} />
            ) : (
              t("profile.addCoinsCta")
            )}
          </button>
        </div>

        <ShopModal
          open={shopOpen}
          onClose={() => setShopOpen(false)}
          coins={me.coins}
          locale={locale}
          onSuccess={(newBalance) => {
            setMe((prev) => (prev ? { ...prev, coins: newBalance } : prev));
            void updateSession?.();
          }}
          onGetCoins={() => {
            setShopOpen(false);
            void buyCoins();
          }}
        />
          </>
        )}
      </div>
    </div>
  );
}
