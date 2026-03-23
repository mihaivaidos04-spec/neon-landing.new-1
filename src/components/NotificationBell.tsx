"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

type InAppNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link: string | null;
  createdAt: string;
};

function resolveHref(link: string | null | undefined): string | null {
  if (!link || typeof link !== "string") return null;
  const t = link.trim();
  if (!t.startsWith("/")) return null;
  return t;
}

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [enteringIds, setEnteringIds] = useState<Set<string>>(new Set());
  const prevIdsRef = useRef<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=10", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const list = (data.notifications ?? []) as InAppNotification[];
        const nextIds = new Set(list.map((n) => n.id));
        const newOnes = list.filter((n) => !prevIdsRef.current.has(n.id)).map((n) => n.id);
        if (newOnes.length > 0 && prevIdsRef.current.size > 0) {
          setEnteringIds(new Set(newOnes));
          window.setTimeout(() => setEnteringIds(new Set()), 600);
        }
        prevIdsRef.current = nextIds;
        setNotifications(list);
        setUnreadCount(typeof data.unreadCount === "number" ? data.unreadCount : 0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
    const id = window.setInterval(() => void fetchNotifications(), 30_000);
    return () => window.clearInterval(id);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    await fetch("/api/notifications/read-all", {
      method: "POST",
      credentials: "include",
    });
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleRowClick = async (n: InAppNotification) => {
    if (!n.read) {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: n.id }),
      });
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    const href = resolveHref(n.link);
    setOpen(false);
    if (href) router.push(href);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (!open) void fetchNotifications();
        }}
        className="relative flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Notifications"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white"
            style={{ boxShadow: "0 0 8px rgba(239, 68, 68, 0.8)" }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="neon-notif-panel-open absolute right-0 top-full z-50 mt-2 w-[min(100vw-1.5rem,20rem)] overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0d] shadow-xl"
          style={{ boxShadow: "0 0 24px rgba(139, 92, 246, 0.15)" }}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <span className="text-sm font-semibold text-white">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void handleMarkAllRead()}
                className="text-xs text-violet-400 hover:text-violet-300"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto overscroll-contain">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-violet-400" />
              </div>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-white/50">No notifications yet</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => void handleRowClick(n)}
                  className={`neon-notif-row flex w-full flex-col items-start border-b border-white/5 px-4 py-3 text-left transition-colors last:border-0 hover:bg-white/[0.06] ${
                    !n.read ? "bg-violet-500/[0.07]" : ""
                  } ${enteringIds.has(n.id) ? "neon-notif-row-enter" : ""}`}
                >
                  <span className="text-sm font-medium text-white">{n.title}</span>
                  {n.message ? (
                    <span className="mt-0.5 line-clamp-3 text-xs text-white/65">{n.message}</span>
                  ) : null}
                  <span className="mt-1 text-[10px] text-white/40">
                    {(() => {
                      const d = new Date(n.createdAt);
                      return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
                    })()}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
