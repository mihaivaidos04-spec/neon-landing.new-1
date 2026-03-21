"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useSocketContext } from "@/src/contexts/SocketContext";
import { getT, getLocaleFromBrowser, type I18nLocale } from "@/src/i18n";

type FriendUser = {
  id: string;
  name: string | null;
  image: string | null;
  lastSeenAt: string;
};

type DmMsg = {
  id: string;
  senderId: string;
  receiverId: string;
  body: string;
  createdAt: string;
};

function appUserId(session: ReturnType<typeof useSession>["data"]): string | null {
  if (!session) return null;
  const s = session as { userId?: string; user?: { id?: string } };
  return s.userId ?? s.user?.id ?? null;
}

/**
 * Slide-up DM panel (friends only). Persists via PrivateMessage + Socket `private_dm`.
 */
export default function MiniMessengerDock() {
  const { data: session, status } = useSession();
  const { socket, connected } = useSocketContext();
  const [locale, setLocale] = useState<I18nLocale>("en");
  const [expanded, setExpanded] = useState(false);
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DmMsg[]>([]);
  const [input, setInput] = useState("");
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const t = getT(locale);
  const myId = appUserId(session);

  useEffect(() => setLocale(getLocaleFromBrowser()), []);

  const loadFriends = useCallback(async () => {
    setLoadingFriends(true);
    try {
      const res = await fetch("/api/friends");
      const data = await res.json().catch(() => ({}));
      if (res.ok) setFriends(data.friends ?? []);
    } finally {
      setLoadingFriends(false);
    }
  }, []);

  const loadThread = useCallback(async (withId: string) => {
    setLoadingThread(true);
    try {
      const res = await fetch(`/api/dm?with=${encodeURIComponent(withId)}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok) setMessages(data.messages ?? []);
    } finally {
      setLoadingThread(false);
    }
  }, []);

  useEffect(() => {
    if (expanded && friends.length === 0 && !loadingFriends) void loadFriends();
  }, [expanded, friends.length, loadingFriends, loadFriends]);

  useEffect(() => {
    if (peerId && expanded) void loadThread(peerId);
  }, [peerId, expanded, loadThread]);

  useEffect(() => {
    if (!socket || !myId) return;
    const onDm = (raw: unknown) => {
      const m = raw as DmMsg;
      if (!m?.id || !m.senderId || !m.receiverId) return;
      const involves = m.senderId === myId || m.receiverId === myId;
      if (!involves) return;
      if (!peerId || m.senderId === peerId || m.receiverId === peerId) {
        setMessages((prev) => {
          if (prev.some((x) => x.id === m.id)) return prev;
          return [...prev, m];
        });
      }
    };
    socket.on("private_dm", onDm);
    return () => {
      socket.off("private_dm", onDm);
    };
  }, [socket, myId, peerId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!peerId || !text || !connected) return;
    setInput("");
    try {
      const res = await fetch("/api/dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId: peerId, body: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.message) {
        setMessages((prev) => [...prev.filter((x) => x.id !== data.message.id), data.message]);
      }
    } catch {
      setInput(text);
    }
  };

  if (status !== "authenticated" || !myId) return null;

  return (
    <div className="pointer-events-none fixed bottom-0 right-0 z-[160] flex flex-col items-end p-3 sm:p-4">
      {expanded && (
        <div
          className="pointer-events-auto mb-2 flex max-h-[min(calc(100dvh-5rem),520px)] w-[min(calc(100vw-1.5rem),380px)] flex-col overflow-hidden rounded-2xl border border-fuchsia-500/30 bg-[#07070c]/98 shadow-[0_0_40px_rgba(236,72,153,0.25),0_16px_48px_rgba(0,0,0,0.55)] backdrop-blur-xl"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2.5">
            <span className="text-sm font-bold text-fuchsia-200">{t("profile.messengerTitle")}</span>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="rounded-lg px-2 py-1 text-xs text-white/60 hover:bg-white/10"
            >
              {t("common.close")}
            </button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
            <div className="max-h-32 shrink-0 overflow-y-auto border-b border-white/10 sm:max-h-none sm:w-[38%] sm:border-b-0 sm:border-r sm:border-white/10">
              {loadingFriends ? (
                <p className="p-3 text-xs text-white/45">{t("common.loading")}</p>
              ) : friends.length === 0 ? (
                <p className="p-3 text-xs text-white/45">{t("profile.messengerNoFriends")}</p>
              ) : (
                <ul className="p-1">
                  {friends.map((f) => (
                    <li key={f.id}>
                      <button
                        type="button"
                        onClick={() => setPeerId(f.id)}
                        className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm ${
                          peerId === f.id ? "bg-fuchsia-500/20 text-white" : "text-white/75 hover:bg-white/5"
                        }`}
                      >
                        <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-white/15 bg-black">
                          {f.image ? (
                            <Image src={f.image} alt="" fill className="object-cover" sizes="32px" unoptimized />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-[10px]">?</span>
                          )}
                        </span>
                        <span className="truncate">{f.name ?? f.id.slice(0, 6)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex min-h-[220px] min-w-0 flex-1 flex-col">
              {!peerId ? (
                <div className="flex flex-1 items-center justify-center p-4 text-center text-xs text-white/45">
                  {t("profile.messengerNoThread")}
                </div>
              ) : (
                <>
                  <div ref={scrollRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
                    {loadingThread ? (
                      <p className="text-xs text-white/45">{t("common.loading")}</p>
                    ) : (
                      messages.map((m) => {
                        const mine = m.senderId === myId;
                        return (
                          <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                            <div
                              className={`max-w-[85%] rounded-xl px-3 py-1.5 text-sm ${
                                mine
                                  ? "bg-gradient-to-br from-fuchsia-600/90 to-violet-700/90 text-white"
                                  : "border border-white/10 bg-black/40 text-white/90"
                              }`}
                            >
                              {m.body}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="border-t border-white/10 p-2">
                    <div className="flex gap-2">
                      <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && void send()}
                        placeholder={t("profile.messengerInputPlaceholder")}
                        disabled={!connected}
                        className="min-h-10 flex-1 rounded-xl border border-white/12 bg-black/50 px-3 text-sm text-white placeholder:text-white/35"
                      />
                      <button
                        type="button"
                        onClick={() => void send()}
                        disabled={!connected || !input.trim()}
                        className="rounded-xl bg-fuchsia-600 px-4 text-sm font-semibold text-white disabled:opacity-40"
                      >
                        {t("profile.messengerSend")}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-fuchsia-500/50 bg-gradient-to-br from-fuchsia-600 to-violet-700 text-white shadow-[0_0_28px_rgba(236,72,153,0.55)] transition hover:scale-[1.03] hover:shadow-[0_0_36px_rgba(236,72,153,0.65)]"
        aria-expanded={expanded}
        aria-label={t("profile.messengerOpen")}
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </button>
    </div>
  );
}
