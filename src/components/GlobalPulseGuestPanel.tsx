"use client";

import { useEffect, useRef, useState } from "react";
import type { ContentLocale } from "../lib/content-i18n";
import { getContentT } from "../lib/content-i18n";
import { getFakeMessageForCycleIndex, type ChatMessage } from "../lib/chat-messages-data";
import { moderateText } from "../lib/text-moderation";
import { truncateChatDisplayUsername } from "../lib/chat-display-username-limit";
import LazyUserFlag from "./LazyUserFlag";

function normalizeNumericText(input: string): string {
  return input
    .replace(/0️⃣/g, "0")
    .replace(/1️⃣/g, "1")
    .replace(/2️⃣/g, "2")
    .replace(/3️⃣/g, "3")
    .replace(/4️⃣/g, "4")
    .replace(/5️⃣/g, "5")
    .replace(/6️⃣/g, "6")
    .replace(/7️⃣/g, "7")
    .replace(/8️⃣/g, "8")
    .replace(/9️⃣/g, "9")
    .replace(/🔟/g, "10")
    .replace(/\uFE0F/g, "")
    .replace(/⃣/g, "");
}

type Props = {
  locale: ContentLocale;
  /** Opens the unified LoginWall modal (same as header Sign in). */
  onOpenLogin: () => void;
  onAttemptChat?: () => void;
};

const MAX_PREVIEW = 14;
const TICK_MS = 3800;

/**
 * Read-only Global Pulse preview for guests + prominent sign-in CTA.
 */
export default function GlobalPulseGuestPanel({ locale, onOpenLogin, onAttemptChat }: Props) {
  const t = getContentT(locale);
  const [lines, setLines] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const cycleRef = useRef(0);
  const seqRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    cycleRef.current = 0;
    seqRef.current = 0;
    setLines([]);
  }, [locale]);

  useEffect(() => {
    const push = () => {
      const idx = cycleRef.current;
      cycleRef.current = (cycleRef.current + 1) % 1000;
      const seq = seqRef.current++;
      const msg = getFakeMessageForCycleIndex(idx, locale, `guest-${seq}`);
      setLines((prev) => [...prev.slice(-(MAX_PREVIEW - 1)), msg]);
    };
    push();
    const id = setInterval(push, TICK_MS + Math.random() * 900);
    return () => clearInterval(id);
  }, [locale]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [lines.length]);

  const previewBlurb: Partial<Record<ContentLocale, string>> = {
    ro: "Intră în feed-ul global — aceeași moderare și rapoarte ca după autentificare.",
    en: "Join the world feed — same moderation & reports as logged-in users.",
    de: "Tritt dem Welt-Feed bei — gleiche Moderation wie mit Konto.",
    fr: "Rejoins le fil mondial — même modération qu’avec un compte.",
    es: "Entra al chat global — la misma moderación que con cuenta.",
    it: "Entra nel feed globale — stessa moderazione degli utenti registrati.",
    pt: "Entra no feed global — a mesma moderação de quem tem conta.",
    nl: "Join de wereld-feed — dezelfde moderatie als met account.",
    pl: "Wejdź na światowy czat — ta sama moderacja co po zalogowaniu.",
    tr: "Küresel sohbete katıl — giriş yapmış kullanıcılarla aynı moderasyon.",
  };
  const blurb = previewBlurb[locale] ?? previewBlurb.en!;

  return (
    <aside
      className="global-pulse-panel flex w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/50 shadow-[0_0_32px_rgba(236,72,153,0.08),0_8px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl xl:max-h-[min(85vh,720px)] xl:rounded-l-xl xl:rounded-r-md"
      aria-label="Global Pulse preview"
    >
      <div
        className="h-[3px] w-full shrink-0 bg-gradient-to-r from-fuchsia-500 via-pink-400 to-fuchsia-500 shadow-[0_0_14px_rgba(244,114,182,0.55),0_2px_8px_rgba(236,72,153,0.35)]"
        aria-hidden
      />

      <div className="border-b border-white/[0.06] bg-black/20 px-3 py-2 xl:px-2.5 xl:py-1.5">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-fuchsia-200/95 xl:text-[10px]">
          Pulse
        </h2>
        <p className="mt-0.5 text-[10px] text-white/45 xl:text-[9px]">Preview · sign in to chat</p>
      </div>

      <div
        ref={scrollRef}
        className="min-h-[200px] flex-1 space-y-2 overflow-y-auto overflow-x-hidden overscroll-y-contain px-2.5 py-2 sm:min-h-[240px] xl:min-h-[180px] xl:space-y-1.5 xl:px-2 [scrollbar-gutter:stable]"
        style={{ contain: "content" }}
      >
        {lines.map((m) => {
          const safeUser = normalizeNumericText(
            truncateChatDisplayUsername(moderateText(m.user ?? "").filtered)
          );
          const safeText = normalizeNumericText(moderateText(m.text).filtered);
          return (
            <div
              key={m.id}
              className="global-pulse-msg-enter rounded-lg border border-white/[0.08] bg-black/30 px-2 py-1.5"
            >
              <div className="flex min-w-0 items-baseline gap-1.5 text-[14px] leading-snug xl:text-[12px]">
                <LazyUserFlag code={m.countryCode ?? null} locale={locale} size="sm" className="mt-[3px] shrink-0" />
                <p className="min-w-0 flex-1 break-words">
                  <span className="font-semibold text-fuchsia-200/95">{safeUser}</span>
                  <span className="text-white/45">: </span>
                  <span className="text-[#faf5eb]/88">{safeText}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-white/[0.06] bg-black/25 bg-gradient-to-t from-fuchsia-950/20 to-transparent p-4 xl:p-2.5">
        <p className="mb-2 text-center text-[11px] leading-relaxed text-white/55 xl:mb-2 xl:text-[9px]">{blurb}</p>
        <div className="mb-2 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (e.target.value.trim()) onAttemptChat?.();
            }}
            onFocus={() => onAttemptChat?.()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAttemptChat?.();
                onOpenLogin();
              }
            }}
            placeholder="Type a message..."
            className="min-h-[42px] flex-1 rounded-lg border border-white/15 bg-black/45 px-3 text-xs text-white/90 placeholder:text-white/35 focus:border-fuchsia-400/45 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={onOpenLogin}
          className="flex min-h-[48px] w-full items-center justify-center rounded-xl border border-fuchsia-400/65 bg-gradient-to-r from-fuchsia-900/80 via-pink-900/70 to-violet-900/80 px-3 py-2.5 text-sm font-semibold text-white shadow-[0_0_22px_rgba(244,114,182,0.35),0_0_36px_rgba(139,92,246,0.18)] transition hover:brightness-110 active:scale-[0.99] xl:min-h-[44px] xl:text-xs"
        >
          {t.connectAccount}
        </button>
        <p className="number-plain mt-2 text-center text-[10px] text-white/40">{t.firstLoginBonus}</p>
      </div>
    </aside>
  );
}
