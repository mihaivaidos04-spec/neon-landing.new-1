"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import type { ContentLocale } from "../lib/content-i18n";
import { getContentT } from "../lib/content-i18n";
import UserListSkeleton from "./UserListSkeleton";
import { QUEUE_UNLOCK_COST, PRIORITY_BOOST_COST } from "../lib/coins";
import { feedbackSuccess } from "../lib/feedback";

function getAvatarUrl(userId: string): string {
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(userId)}`;
}

type Props = {
  locale: ContentLocale;
  visible: boolean;
  coins: number;
  onSpend?: (amount: number, reason?: string) => Promise<boolean>;
  setCoins?: (fn: (prev: number) => number) => void;
  onOpenShop?: () => void;
  onWalletRefetch?: () => void | Promise<void>;
  onBoostedMatch?: (partnerId: string, partnerNickname?: string | null) => void;
};

export default function QueuePreview({
  locale,
  visible,
  coins,
  onSpend,
  setCoins,
  onOpenShop,
  onWalletRefetch,
  onBoostedMatch,
}: Props) {
  const t = getContentT(locale);
  const [users, setUsers] = useState<{ userId: string }[]>([]);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [boostLoading, setBoostLoading] = useState(false);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/match/queue-preview");
      const data = await res.json().catch(() => ({}));
      setUsers(data.users ?? []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBoost = useCallback(async () => {
    if (coins < PRIORITY_BOOST_COST) {
      onOpenShop?.();
      return;
    }
    setBoostLoading(true);
    try {
      const res = await fetch("/api/match/boost", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        await onWalletRefetch?.();
        feedbackSuccess();
        if (data.status === "matched" && data.partnerId) {
          onBoostedMatch?.(
            data.partnerId,
            typeof data.partnerNickname === "string" ? data.partnerNickname : null
          );
        }
        fetchQueue();
      }
    } finally {
      setBoostLoading(false);
    }
  }, [coins, onOpenShop, onWalletRefetch, onBoostedMatch, fetchQueue]);

  useEffect(() => {
    if (visible) fetchQueue();
  }, [visible, fetchQueue]);

  const handleUnlock = useCallback(
    async (userId: string) => {
      if (unlocked.has(userId)) return;
      if (coins < QUEUE_UNLOCK_COST) {
        onOpenShop?.();
        return;
      }
      if (onSpend) {
        const ok = await onSpend(QUEUE_UNLOCK_COST, "queue_preview_unlock");
        if (ok) {
          setUnlocked((prev) => new Set(prev).add(userId));
          feedbackSuccess();
        }
      } else if (setCoins) {
        setCoins((c) => c - QUEUE_UNLOCK_COST);
        setUnlocked((prev) => new Set(prev).add(userId));
        feedbackSuccess();
      }
    },
    [coins, unlocked, onSpend, setCoins, onOpenShop]
  );

  if (!visible) return null;

  const canAffordBoost = coins >= PRIORITY_BOOST_COST || !!onSpend;

  return (
    <div className="card-neon mt-3 rounded-xl border border-white/10 px-4 py-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-white/90">
          {t.queuePreviewTitle}
        </h3>
        <button
          type="button"
          onClick={handleBoost}
          disabled={!canAffordBoost || boostLoading}
          className="rounded-lg bg-[#8b5cf6] px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-[#7c3aed] disabled:opacity-50 disabled:hover:bg-[#8b5cf6]"
        >
          {boostLoading ? "..." : `${t.priorityBoostLabel} (${PRIORITY_BOOST_COST})`}
        </button>
      </div>
      {loading ? (
        <UserListSkeleton count={3} />
      ) : users.length === 0 ? (
        <p className="text-xs text-white/50">{t.queuePreviewEmpty}</p>
      ) : (
        <div className="flex gap-4">
          {users.map(({ userId }) => {
            const isUnlocked = unlocked.has(userId);
            const canAfford = coins >= QUEUE_UNLOCK_COST;
            return (
              <div
                key={userId}
                className="flex flex-col items-center gap-2"
              >
                <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-white/20 bg-zinc-800">
                  <Image
                    src={getAvatarUrl(userId)}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                    style={{
                      filter: isUnlocked ? "none" : "blur(24px)",
                      transition: "filter 0.3s ease",
                    }}
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzFmMjAzMyIvPjwvc3ZnPg=="
                  />
                </div>
                {!isUnlocked && (
                  <button
                    type="button"
                    onClick={() => handleUnlock(userId)}
                    disabled={!canAfford}
                    className="rounded-lg bg-[#8b5cf6]/80 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-[#8b5cf6] disabled:opacity-50 disabled:hover:bg-[#8b5cf6]/80"
                  >
                    {t.queuePreviewUnlock} ({QUEUE_UNLOCK_COST})
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
