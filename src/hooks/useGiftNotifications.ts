"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

const GIFT_NAMES: Record<string, string> = { heart: "Heart", fire: "Fire", rocket: "Rocket" };
const POLL_MS = 8000;

export function useGiftNotifications() {
  const { data: session, status } = useSession();
  const lastSeenRef = useRef<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;

    const poll = async () => {
      try {
        const since = lastSeenRef.current ?? new Date(Date.now() - 60 * 1000).toISOString();
        const res = await fetch(`/api/gift/received?since=${encodeURIComponent(since)}`);
        if (!res.ok) return;
        const data = await res.json();
        const items = data.transactions ?? [];
        for (const t of items) {
          const giftName = GIFT_NAMES[t.giftType] ?? "Gift";
          toast(`${t.senderName} sent you a ${giftName}!`, {
            icon: "🎁",
            duration: 5000,
          });
          if (t.createdAt) lastSeenRef.current = t.createdAt;
        }
      } catch {
        // ignore
      }
    };

    const id = setInterval(poll, POLL_MS);
    poll();
    return () => clearInterval(id);
  }, [status]);
}
