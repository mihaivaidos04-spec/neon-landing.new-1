"use client";

import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import type { ContentLocale } from "../lib/content-i18n";
import { useSocketContext } from "../contexts/SocketContext";
import LazyUserFlag from "./LazyUserFlag";
import { prepareGlobalPulseOutgoingMessage } from "../lib/global-pulse-moderation";
import { sanitizeForDisplay } from "../lib/text-moderation";
import { truncateChatDisplayUsername } from "../lib/chat-display-username-limit";
import { neonVipGlowVariant } from "../lib/neon-vip-style";

export type GlobalPulseMessage = {
  id: string;
  userId: string;
  userName: string;
  countryCode: string | null;
  message: string;
  ts: number;
  neonVip?: boolean;
};

const SCROLL_BOTTOM_THRESHOLD_PX = 72;

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
  const safeUser = truncateChatDisplayUsername(sanitizeForDisplay(m.userName || "User"));
  const safeMsg = sanitizeForDisplay(m.message);
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

  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const systemLineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const userId =
    status === "authenticated"
      ? ((session as { userId?: string })?.userId ?? session?.user?.id) ?? null
      : null;
  const countryCode = session?.countryCode ?? null;
  const displayName =
    session?.user?.name?.trim() ||
    session?.user?.email?.split("@")[0] ||
    "User";

  const updateStickFromScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = dist <= SCROLL_BOTTOM_THRESHOLD_PX;
  }, []);

  useEffect(() => {
    if (!socket || !userId) return;

    const onHistory = (list: unknown) => {
      if (!Array.isArray(list)) return;
      stickToBottomRef.current = true;
      setMessages(
        list.filter(
          (m): m is GlobalPulseMessage =>
            m &&
            typeof m === "object" &&
            typeof (m as GlobalPulseMessage).id === "string" &&
            typeof (m as GlobalPulseMessage).message === "string"
        ) as GlobalPulseMessage[]
      );
    };

    const onMessage = (msg: GlobalPulseMessage) => {
      if (!msg?.id) return;
      setMessages((prev) => {
        if (prev.some((p) => p.id === msg.id)) return prev;
        if (msg.userId === userId) {
          stickToBottomRef.current = true;
        }
        return [...prev.slice(-199), msg];
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

    socket.on("global_pulse_history", onHistory);
    socket.on("global_pulse_message", onMessage);
    socket.on("global_pulse_messages_removed", onMessagesRemoved);
    socket.emit("global_pulse_request_history");

    return () => {
      socket.off("global_pulse_history", onHistory);
      socket.off("global_pulse_message", onMessage);
      socket.off("global_pulse_messages_removed", onMessagesRemoved);
    };
  }, [socket, userId]);

  useLayoutEffect(() => {
    if (!stickToBottomRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    return () => {
      if (systemLineTimerRef.current) clearTimeout(systemLineTimerRef.current);
    };
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

    stickToBottomRef.current = true;

    socket.emit("global_pulse_send", {
      message: prep.text,
      userName: sanitizeForDisplay(displayName).slice(0, 80) || "User",
      countryCode: countryCode && countryCode.length === 2 ? countryCode.toUpperCase() : null,
    });
    setInput("");
  }, [socket, connected, userId, input, displayName, countryCode, showSystemLine]);

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

  if (status !== "authenticated" || !userId) {
    return null;
  }

  return (
    <aside
      className="global-pulse-panel flex w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/50 shadow-[0_0_32px_rgba(236,72,153,0.08),0_8px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl xl:max-h-[min(85vh,720px)] xl:rounded-l-xl xl:rounded-r-md"
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
        onScroll={updateStickFromScroll}
        className="global-pulse-scroll min-h-[220px] flex-1 space-y-2 overflow-y-auto overflow-x-hidden overscroll-y-contain px-3 py-2.5 sm:min-h-[280px] xl:min-h-[200px] [scrollbar-gutter:stable]"
        style={{ contain: "content" }}
      >
        {messages.length === 0 && (
          <p className="px-1 py-6 text-center text-[14px] text-white/40 xl:text-xs">
            No messages yet. Say hi to the world.
          </p>
        )}
        {messages.map((m) => (
          <GlobalPulseMessageRow
            key={m.id}
            m={m}
            userId={userId}
            locale={locale}
            reportingId={reportingId}
            onReport={handleReport}
          />
        ))}
      </div>

      <div className="border-t border-white/[0.06] bg-black/25 p-2.5 xl:p-2">
        {systemLine && (
          <p
            className="mb-2 rounded-md border border-amber-500/25 bg-amber-950/30 px-2 py-1 text-center text-[10px] font-medium leading-tight text-amber-200/95"
            role="status"
          >
            {systemLine}
          </p>
        )}
        <div className="flex flex-col gap-2 sm:flex-row xl:flex-col xl:gap-1.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
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
            className="min-h-[44px] shrink-0 rounded-xl bg-gradient-to-br from-fuchsia-600 to-pink-600 px-4 py-2 text-[14px] font-semibold text-white shadow-[0_0_22px_rgba(236,72,153,0.4)] transition hover:opacity-95 disabled:opacity-40 xl:min-h-[40px] xl:w-full xl:text-xs"
          >
            Send
          </button>
        </div>
        <p className="mt-1.5 text-[9px] leading-snug text-white/30 xl:mt-1 xl:text-[8px]">
          Profanity is masked. Spam, links &amp; scams are blocked. Reports go to moderators.
        </p>
      </div>
    </aside>
  );
}
