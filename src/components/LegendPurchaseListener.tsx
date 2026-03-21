"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import confetti from "canvas-confetti";
import { useSocketContext } from "@/src/contexts/SocketContext";
import { getT, getLocaleFromBrowser, type I18nLocale } from "@/src/i18n";

type LegendPayload = {
  userId: string;
  userName: string;
  coinsAdded: number;
};

function inter(tpl: string, vars: Record<string, string | number>) {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : ""));
}

/** Full-screen “boss” celebration for the purchaser only (canvas-confetti). */
function fireNeonLegendBossConfetti() {
  const colors = [
    "#fbbf24",
    "#f59e0b",
    "#fde68a",
    "#f472b6",
    "#e879f9",
    "#a855f7",
    "#22d3ee",
    "#67e8f9",
  ];

  void confetti({
    particleCount: 140,
    spread: 360,
    startVelocity: 48,
    origin: { x: 0.5, y: 0.42 },
    colors,
    ticks: 320,
    gravity: 0.92,
    scalar: 1.25,
    decay: 0.91,
  });

  const sideBursts = [0, 90, 180, 270];
  for (const ms of sideBursts) {
    setTimeout(() => {
      void confetti({
        particleCount: 45,
        angle: 60,
        spread: 58,
        origin: { x: 0.08, y: 0.58 },
        colors,
        ticks: 220,
        gravity: 1,
        scalar: 1.15,
      });
      void confetti({
        particleCount: 45,
        angle: 120,
        spread: 58,
        origin: { x: 0.92, y: 0.58 },
        colors,
        ticks: 220,
        gravity: 1,
        scalar: 1.15,
      });
    }, ms);
  }

  setTimeout(() => {
    void confetti({
      particleCount: 90,
      spread: 100,
      origin: { x: 0.5, y: 0.2 },
      colors,
      ticks: 260,
      gravity: 1.05,
      scalar: 1.05,
    });
  }, 200);
}

const BANNER_MS = 5000;

/**
 * Global NEON LEGEND alert ($18.99 Stripe Whale Pack): 5s top banner for all online users;
 * canvas-confetti boss burst for the buyer only.
 */
export default function LegendPurchaseListener() {
  const { data: session, status } = useSession();
  const { socket } = useSocketContext();
  const [banner, setBanner] = useState<LegendPayload | null>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [locale, setLocale] = useState<I18nLocale>("en");

  useEffect(() => {
    setLocale(getLocaleFromBrowser());
  }, []);

  const t = getT(locale);

  const myUserId =
    status === "authenticated"
      ? ((session as { userId?: string })?.userId ?? session?.user?.id) ?? null
      : null;

  const onLegend = useCallback(
    (raw: unknown) => {
      const p = raw as LegendPayload;
      if (!p?.userId || !p.userName) return;

      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      setBanner(p);
      clearTimerRef.current = setTimeout(() => {
        setBanner(null);
        clearTimerRef.current = null;
      }, BANNER_MS);

      if (myUserId && p.userId === myUserId) {
        fireNeonLegendBossConfetti();
      }
    },
    [myUserId]
  );

  useEffect(() => {
    if (!socket || status !== "authenticated") return;
    socket.on("legend_purchase_broadcast", onLegend);
    return () => {
      socket.off("legend_purchase_broadcast", onLegend);
    };
  }, [socket, status, onLegend]);

  if (!banner) return null;

  const msg = inter(t("legend.broadcast"), {
    user: banner.userName,
  });

  return (
    <div
      className="neon-legend-banner-enter fixed left-0 right-0 top-0 z-[200] border-b border-cyan-400/30 bg-gradient-to-r from-fuchsia-950/98 via-violet-950/98 to-cyan-950/95 px-4 py-3 text-center shadow-[0_0_48px_rgba(236,72,153,0.45),0_8px_32px_rgba(34,211,238,0.2)] backdrop-blur-md"
      role="status"
      aria-live="assertive"
    >
      <p className="neon-legend-banner-text mx-auto max-w-4xl text-sm font-extrabold tracking-wide text-white drop-shadow-[0_0_12px_rgba(251,191,36,0.85)] sm:text-base">
        {msg}
      </p>
    </div>
  );
}
