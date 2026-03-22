"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import type { ContentLocale } from "../lib/content-i18n";
import { useSocketContext } from "../contexts/SocketContext";
import LazyUserFlag from "./LazyUserFlag";
import { prepareGlobalPulseOutgoingMessage } from "../lib/global-pulse-moderation";
import { sanitizeForDisplay } from "../lib/text-moderation";
import { truncateChatDisplayUsername } from "../lib/chat-display-username-limit";
import { neonVipGlowVariant } from "../lib/neon-vip-style";
import { GLOBAL_PULSE_FLOATING_REACTION_EMOJIS } from "../lib/global-pulse-floating-reactions";
import { GLOBAL_PULSE_VISIBLE_MESSAGES } from "../lib/global-pulse-visible-messages";

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

export type GlobalPulseMessage = {
  id: string;
  userId: string;
  userName: string;
  countryCode: string | null;
  message: string;
  ts: number;
  neonVip?: boolean;
};

const MAX_FLOATING_PARTICLES = 280;
const TYPING_TTL_MS = 3800;
const TYPING_STOP_DEBOUNCE_MS = 2000;
const TYPING_PRUNE_MS = 400;
const AUTO_SCROLL_NEAR_BOTTOM_PX = 88;

type FloatingParticle = {
  id: string;
  emoji: string;
  leftPct: number;
  delayMs: number;
  driftPx: number;
  size: number;
  rotDeg: number;
};

function makeFloatingBurst(emoji: string): FloatingParticle[] {
  const burstKey = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const count = 11 + Math.floor(Math.random() * 8);
  const out: FloatingParticle[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      id: `${burstKey}_${i}`,
      emoji,
      leftPct: 4 + Math.random() * 92,
      delayMs: Math.random() * 320,
      driftPx: (Math.random() - 0.5) * 120,
      size: 0.72 + Math.random() * 0.75,
      rotDeg: (Math.random() - 0.5) * 40,
    });
  }
  return out;
}

type Props = {
  locale?: ContentLocale;
};

type RowProps = {
  m: GlobalPulseMessage;
  userId: string;
  locale: ContentLocale;
  reportingId: string | null;
  onReport: (reportedUserId: string, messageId: string) => void;
};

const GlobalPulseMessageRow = memo(function GlobalPulseMessageRow({
  m,
  userId,
  locale,
  reportingId,
  onReport,
}: RowProps) {
  const isSelf = m.userId === userId;
  const safeUser = normalizeNumericText(
    truncateChatDisplayUsername(sanitizeForDisplay(m.userName || "User"))
  );
  const safeMsg = normalizeNumericText(sanitizeForDisplay(m.message));
  const vipGlow = m.neonVip ? neonVipGlowVariant(m.userId) : false;

  return (
    <div
      className={`global-pulse-msg-enter group rounded-lg border px-2 py-1.5 ${
        isSelf
          ? "border-emerald-500/20 bg-emerald-950/15"
          : "border-white/[0.08] bg-black/30"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-baseline gap-1.5 text-[14px] leading-snug xl:text-[12px] xl:leading-snug">
          <LazyUserFlag
            code={m.countryCode}
            locale={locale}
            size="sm"
            className="mt-[3px] shrink-0 xl:mt-0.5"
          />
          <p className="min-w-0 flex-1 break-words">
            <span
              className={`font-semibold text-fuchsia-200/95 ${
                vipGlow === "gold"
                  ? "neon-vip-name-gold"
                  : vipGlow === "blue"
                    ? "neon-vip-name-blue"
                    : ""
              }`}
            >
              {safeUser}
            </span>
            <span className="text-white/45">: </span>
            <span className="text-[#faf5eb]/92">{safeMsg}</span>
          </p>
        </div>
        {!isSelf && (
          <button
            type="button"
            onClick={() => onReport(m.userId, m.id)}
            disabled={reportingId === m.id}
            className="flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded-md border border-red-500/30 bg-red-950/35 px-1.5 text-[8px] font-semibold uppercase tracking-wide text-red-300/90 opacity-80 transition hover:border-red-400/45 hover:opacity-100 disabled:opacity-40 xl:min-h-8 xl:min-w-8 xl:text-[7px]"
          >
            {reportingId === m.id ? "…" : "Rpt"}
          </button>
        )}
      </div>
    </div>
  );
});

export default function GlobalPulseChat({ locale = "en" }: Props) {
  const { data: session, status } = useSession();
  const { socket, connected } = useSocketContext();
  const [messages, setMessages] = useState<GlobalPulseMessage[]>([]);
  const [input, setInput] = useState("");
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [systemLine, setSystemLine] = useState<string | null>(null);
  const [floatingParticles, setFloatingParticles] = useState<FloatingParticle[]>([]);
  const [portalReady, setPortalReady] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnreadBelow, setHasUnreadBelow] = useState(false);
  /** Other users currently typing (expires via TTL). */
  const [typingOthers, setTypingOthers] = useState<Record<string, { userName: string; until: number }>>({});

  const scrollRef = useRef<HTMLDivElement>(null);
  const typingStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const systemLineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isNearBottomRef = useRef(true);
  const prevMessagesLenRef = useRef(0);
  const forceScrollOnNextMessageRef = useRef(true);

  const userId =
    status === "authenticated"
      ? ((session as { userId?: string })?.userId ?? session?.user?.id) ?? null
      : null;
  const countryCode = session?.countryCode ?? null;
  const displayName =
    session?.user?.name?.trim() ||
    session?.user?.email?.split("@")[0] ||
    "User";

  const pushFloatingBurst = useCallback((emoji: string) => {
    const burst = makeFloatingBurst(emoji);
    setFloatingParticles((prev) => [...prev, ...burst].slice(-MAX_FLOATING_PARTICLES));
  }, []);

  const removeParticle = useCallback((id: string) => {
    setFloatingParticles((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const clearTypingStopTimer = useCallback(() => {
    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = null;
    }
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    isNearBottomRef.current = true;
    setHasUnreadBelow(false);
  }, []);

  const emitTypingStop = useCallback(() => {
    clearTypingStopTimer();
    setIsTyping(false);
    if (!socket || !connected || !userId) return;
    socket.emit("global_pulse_typing", { active: false });
  }, [socket, connected, userId, clearTypingStopTimer]);

  const emitTypingActive = useCallback(() => {
    if (!socket || !connected || !userId) return;
    const name = sanitizeForDisplay(displayName).slice(0, 40) || "User";
    socket.emit("global_pulse_typing", { active: true, userName: name });
  }, [socket, connected, userId, displayName]);

  const scheduleTypingStop = useCallback(() => {
    clearTypingStopTimer();
    typingStopTimerRef.current = setTimeout(() => {
      emitTypingStop();
    }, TYPING_STOP_DEBOUNCE_MS);
  }, [clearTypingStopTimer, emitTypingStop]);

  useEffect(() => {
    if (!socket || !userId) return;

    const onHistory = (list: unknown) => {
      if (!Array.isArray(list)) return;
      const filtered = list.filter(
        (m): m is GlobalPulseMessage =>
          m &&
          typeof m === "object" &&
          typeof (m as GlobalPulseMessage).id === "string" &&
          typeof (m as GlobalPulseMessage).message === "string"
      ) as GlobalPulseMessage[];
      forceScrollOnNextMessageRef.current = true;
      setMessages(filtered.slice(-GLOBAL_PULSE_VISIBLE_MESSAGES));
    };

    const onMessage = (msg: GlobalPulseMessage) => {
      if (!msg?.id) return;
      setMessages((prev) => {
        if (prev.some((p) => p.id === msg.id)) return prev;
        return [...prev, msg].slice(-GLOBAL_PULSE_VISIBLE_MESSAGES);
      });
    };

    const onMessagesRemoved = (payload: unknown) => {
      if (!payload || typeof payload !== "object") return;
      const ids = (payload as { ids?: unknown }).ids;
      if (!Array.isArray(ids) || ids.length === 0) return;
      const idSet = new Set(ids.filter((x): x is string => typeof x === "string"));
      if (idSet.size === 0) return;
      setMessages((prev) => prev.filter((m) => !idSet.has(m.id)));
    };

    const onFloatingReaction = (payload: unknown) => {
      if (!payload || typeof payload !== "object") return;
      const emoji = (payload as { emoji?: string }).emoji;
      if (typeof emoji !== "string" || !emoji) return;
      pushFloatingBurst(emoji);
    };

    const onTypingUpdate = (payload: unknown) => {
      if (!payload || typeof payload !== "object") return;
      const p = payload as { userId?: string; userName?: string; active?: boolean };
      const typerId = typeof p.userId === "string" ? p.userId : "";
      if (!typerId || typerId === userId) return;
      const name = typeof p.userName === "string" ? p.userName : "Someone";
      if (p.active === true) {
        const until = Date.now() + TYPING_TTL_MS;
        setTypingOthers((prev) => ({ ...prev, [typerId]: { userName: name, until } }));
      } else {
        setTypingOthers((prev) => {
          if (!(typerId in prev)) return prev;
          const next = { ...prev };
          delete next[typerId];
          return next;
        });
      }
    };

    socket.on("global_pulse_history", onHistory);
    socket.on("global_pulse_message", onMessage);
    socket.on("global_pulse_messages_removed", onMessagesRemoved);
    socket.on("global_pulse_floating_reaction", onFloatingReaction);
    socket.on("global_pulse_typing_update", onTypingUpdate);
    socket.emit("global_pulse_request_history");

    return () => {
      socket.off("global_pulse_history", onHistory);
      socket.off("global_pulse_message", onMessage);
      socket.off("global_pulse_messages_removed", onMessagesRemoved);
      socket.off("global_pulse_floating_reaction", onFloatingReaction);
      socket.off("global_pulse_typing_update", onTypingUpdate);
    };
  }, [socket, userId, pushFloatingBurst]);

  /** Drop stale typing entries */
  useEffect(() => {
    const id = window.setInterval(() => {
      const now = Date.now();
      setTypingOthers((prev) => {
        const next: Record<string, { userName: string; until: number }> = {};
        for (const [k, v] of Object.entries(prev)) {
          if (v.until > now) next[k] = v;
        }
        return Object.keys(next).length === Object.keys(prev).length ? prev : next;
      });
    }, TYPING_PRUNE_MS);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const grew = messages.length > prevMessagesLenRef.current;
    const shouldForceScroll = forceScrollOnNextMessageRef.current;

    if (messages.length > 0 && (shouldForceScroll || grew)) {
      if (shouldForceScroll || isNearBottomRef.current) {
        requestAnimationFrame(() => scrollToBottom(shouldForceScroll ? "auto" : "smooth"));
      } else if (grew) {
        setHasUnreadBelow(true);
      }
    }

    if (shouldForceScroll) {
      forceScrollOnNextMessageRef.current = false;
    }
    prevMessagesLenRef.current = messages.length;
  }, [messages, scrollToBottom]);

  useEffect(() => {
    return () => {
      if (systemLineTimerRef.current) clearTimeout(systemLineTimerRef.current);
    };
  }, []);

  useEffect(() => {
    return () => {
      clearTypingStopTimer();
      if (socket && userId) {
        try {
          socket.emit("global_pulse_typing", { active: false });
        } catch {
          /* ignore */
        }
      }
    };
  }, [socket, userId, clearTypingStopTimer]);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const showSystemLine = useCallback((text: string) => {
    setSystemLine(text);
    if (systemLineTimerRef.current) clearTimeout(systemLineTimerRef.current);
    systemLineTimerRef.current = setTimeout(() => {
      setSystemLine(null);
      systemLineTimerRef.current = null;
    }, 4500);
  }, []);

  const handleSend = useCallback(() => {
    if (!socket || !connected || !userId) {
      toast.error("Connect to send messages.");
      return;
    }
    const raw = input.trim();
    const prep = prepareGlobalPulseOutgoingMessage(raw);

    if (!prep.ok) {
      if (prep.systemAlert) {
        showSystemLine("System: Message blocked");
      }
      toast.error(prep.reason);
      return;
    }

    emitTypingStop();
    forceScrollOnNextMessageRef.current = true;
    socket.emit("global_pulse_send", {
      message: prep.text,
      userName: sanitizeForDisplay(displayName).slice(0, 80) || "User",
      countryCode: countryCode && countryCode.length === 2 ? countryCode.toUpperCase() : null,
    });
    setInput("");
  }, [socket, connected, userId, input, displayName, countryCode, showSystemLine, emitTypingStop]);

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setInput(v);
      if (!socket || !connected || !userId) return;
      const trimmed = v.trim();
      if (!trimmed) {
        emitTypingStop();
        return;
      }
      if (!isTyping) {
        emitTypingActive();
        setIsTyping(true);
      }
      scheduleTypingStop();
    },
    [socket, connected, userId, emitTypingStop, emitTypingActive, isTyping, scheduleTypingStop]
  );

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceToBottom <= AUTO_SCROLL_NEAR_BOTTOM_PX;
    isNearBottomRef.current = nearBottom;
    if (nearBottom && hasUnreadBelow) {
      setHasUnreadBelow(false);
    }
  }, [hasUnreadBelow]);

  const typingDisplayList = useMemo(
    () =>
      Object.entries(typingOthers).map(([id, v]) => ({
        id,
        label: truncateChatDisplayUsername(sanitizeForDisplay(v.userName || "Someone")),
      })),
    [typingOthers]
  );

  const typingLineText = useMemo(() => {
    if (typingDisplayList.length === 0) return "";
    const ro = locale === "ro";
    if (typingDisplayList.length === 1) {
      return ro
        ? `${typingDisplayList[0].label} scrie…`
        : `${typingDisplayList[0].label} is typing…`;
    }
    if (typingDisplayList.length === 2) {
      const [a, b] = typingDisplayList;
      return ro ? `${a.label} și ${b.label} scriu…` : `${a.label} and ${b.label} are typing…`;
    }
    const n = typingDisplayList.length;
    return ro ? `${n} persoane scriu…` : `${n} people are typing…`;
  }, [typingDisplayList, locale]);

  const handleReport = useCallback(
    async (reportedUserId: string, messageId: string) => {
      if (!userId || reportedUserId === userId) return;
      setReportingId(messageId);
      try {
        const res = await fetch("/api/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reportedUserId,
            reason: "global_pulse_message",
            context: { messageId, source: "global_pulse" },
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          toast.success("Report submitted. Thank you.");
        } else {
          toast.error(data.error ?? "Could not submit report.");
        }
      } catch {
        toast.error("Could not submit report.");
      } finally {
        setReportingId(null);
      }
    },
    [userId]
  );

  const sendFloatingReaction = useCallback(
    (emoji: string) => {
      if (!socket || !connected || !userId) {
        toast.error("Connect to send reactions.");
        return;
      }
      socket.emit("global_pulse_floating_reaction", { emoji });
    },
    [socket, connected, userId]
  );

  if (status !== "authenticated" || !userId) {
    return null;
  }

  const floatingOverlay =
    portalReady && typeof document !== "undefined"
      ? createPortal(
          <div
            className="pointer-events-none fixed inset-0 z-[9998] overflow-hidden"
            aria-hidden
          >
            {floatingParticles.map((p) => (
              <span
                key={p.id}
                role="presentation"
                data-particle-id={p.id}
                className="global-pulse-floating-emoji-particle"
                style={
                  {
                    left: `${p.leftPct}%`,
                    animationDelay: `${p.delayMs}ms`,
                    fontSize: `clamp(1.1rem, ${p.size * 3.2}vw, 2.75rem)`,
                    "--gp-drift": `${p.driftPx}px`,
                    "--gp-sz": String(p.size),
                    "--gp-rot": `${p.rotDeg}deg`,
                  } as CSSProperties
                }
                onAnimationEnd={() => removeParticle(p.id)}
              >
                <span className="emoji-ios">{p.emoji}</span>
              </span>
            ))}
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {floatingOverlay}
    <aside
      className="global-pulse-panel relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/50 shadow-[0_0_32px_rgba(236,72,153,0.08),0_8px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl xl:rounded-l-xl xl:rounded-r-md"
      aria-label="Global Pulse world chat"
    >
      {/* Neon pink top accent */}
      <div
        className="h-[3px] w-full shrink-0 bg-gradient-to-r from-fuchsia-500 via-pink-400 to-fuchsia-500 shadow-[0_0_14px_rgba(244,114,182,0.55),0_2px_8px_rgba(236,72,153,0.35)]"
        aria-hidden
      />

      <div className="border-b border-white/[0.06] bg-black/20 px-3 py-2 xl:px-2.5 xl:py-1.5">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-fuchsia-200/95 xl:text-[10px]">
          Pulse
        </h2>
        <p className="mt-0.5 text-[10px] leading-tight text-white/40 xl:hidden">
          Public world chat · moderated
        </p>
        <p className="mt-0.5 hidden text-[9px] leading-tight text-white/35 xl:block">World · moderated</p>
        {!connected && (
          <p className="mt-1 text-[10px] font-medium text-amber-400/90">Connecting…</p>
        )}
      </div>

      <div
        ref={scrollRef}
        className="global-pulse-scroll min-h-0 flex-1 space-y-2 overflow-y-auto overflow-x-hidden overscroll-y-contain px-3 py-2.5 scroll-smooth [scrollbar-gutter:stable]"
        style={{ contain: "content" }}
        onScroll={handleScroll}
      >
        {messages.length === 0 && (
          <p className="px-1 py-6 text-center text-[14px] text-white/40 xl:text-xs">
            No messages yet. Say hi to the world.
          </p>
        )}
        {messages.map((m, idx) => {
          return (
            <div key={m.id} className="scroll-mt-2">
              <GlobalPulseMessageRow
                m={m}
                userId={userId}
                locale={locale}
                reportingId={reportingId}
                onReport={handleReport}
              />
            </div>
          );
        })}
        {typingDisplayList.length > 0 && (
          <div
            className="flex items-center gap-2 rounded-lg border border-fuchsia-500/15 bg-fuchsia-950/20 px-2.5 py-1.5 text-[13px] text-fuchsia-100/75 xl:text-[11px]"
            aria-live="polite"
          >
            <span className="flex shrink-0 gap-0.5" aria-hidden>
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-fuchsia-400/90 [animation-delay:0ms]" />
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-fuchsia-400/90 [animation-delay:150ms]" />
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-fuchsia-400/90 [animation-delay:300ms]" />
            </span>
            <span className="min-w-0 truncate">{typingLineText}</span>
          </div>
        )}
      </div>
      {hasUnreadBelow && (
        <button
          type="button"
          onClick={() => scrollToBottom("smooth")}
          className="absolute bottom-[6.1rem] left-1/2 z-20 -translate-x-1/2 rounded-full border border-fuchsia-400/55 bg-black/75 px-3 py-1.5 text-[11px] font-semibold text-fuchsia-100 shadow-[0_0_18px_rgba(236,72,153,0.32)] backdrop-blur-md transition hover:bg-fuchsia-950/35"
        >
          New messages
        </button>
      )}

      <div className="border-t border-white/[0.06] bg-black/25 p-2.5 xl:p-2">
        {systemLine && (
          <p
            className="mb-2 rounded-md border border-amber-500/25 bg-amber-950/30 px-2 py-1 text-center text-[10px] font-medium leading-tight text-amber-200/95"
            role="status"
          >
            {systemLine}
          </p>
        )}
        <div className="mb-2 flex flex-wrap items-center gap-1.5 xl:gap-1">
          <span className="w-full text-[9px] font-semibold uppercase tracking-wider text-white/35 xl:mb-0 xl:w-auto xl:pr-1">
            {locale === "ro" ? "Reacții" : "Reactions"}
          </span>
          {GLOBAL_PULSE_FLOATING_REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              title={`Send ${emoji}`}
              disabled={!connected}
              onClick={() => sendFloatingReaction(emoji)}
              className="flex h-9 min-h-9 min-w-9 items-center justify-center rounded-lg border border-white/10 bg-black/40 text-lg leading-none transition hover:border-fuchsia-500/40 hover:bg-fuchsia-950/30 active:scale-95 disabled:opacity-40 xl:h-8 xl:min-h-8 xl:min-w-8 xl:text-base"
            >
              <span className="emoji-ios text-[1.35rem] leading-none xl:text-xl">{emoji}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row xl:flex-col xl:gap-1.5">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            onBlur={() => emitTypingStop()}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            maxLength={280}
            placeholder={connected ? "Pulse the world…" : "Connecting…"}
            disabled={!connected}
            className="min-h-[44px] flex-1 rounded-xl border border-white/12 bg-black/45 px-3 py-2 text-[14px] text-white placeholder:text-white/35 focus:border-fuchsia-500/45 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/25 disabled:opacity-50 xl:min-h-[40px] xl:text-xs"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!connected || !input.trim()}
            className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-fuchsia-600 to-pink-600 px-4 py-2 text-[14px] font-semibold text-white shadow-[0_0_22px_rgba(236,72,153,0.4)] transition hover:opacity-95 disabled:opacity-40 xl:min-h-[40px] xl:w-full xl:text-xs"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
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
        </div>
        <p className="mt-1.5 text-[9px] leading-snug text-white/30 xl:mt-1 xl:text-[8px]">
          Profanity is masked. Spam, links &amp; scams are blocked. Reports go to moderators.
        </p>
      </div>
    </aside>
    </>
  );
}
