"use client";

import { useState, useEffect, useCallback } from "react";

export type DailyRewardStatus = {
  streak: number;
  claimedToday: boolean;
  goldBadge: boolean;
  loading: boolean;
};

export function useDailyReward(enabled: boolean) {
  const [status, setStatus] = useState<DailyRewardStatus>({
    streak: 0,
    claimedToday: false,
    goldBadge: false,
    loading: true,
  });

  const fetchStatus = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await fetch("/api/daily-reward/status");
      const data = await res.json().catch(() => ({}));
      setStatus((s) => ({
        ...s,
        streak: data.streak ?? 0,
        claimedToday: data.claimedToday ?? false,
        goldBadge: data.goldBadge ?? false,
        loading: false,
      }));
    } catch {
      setStatus((s) => ({ ...s, loading: false }));
    }
  }, [enabled]);

  const claim = useCallback(async () => {
    if (!enabled) return null;
    try {
      const res = await fetch("/api/daily-reward/claim", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      await fetchStatus();
      return data;
    } catch {
      return null;
    }
  }, [enabled, fetchStatus]);

  useEffect(() => {
    if (!enabled) {
      setStatus((s) => ({ ...s, loading: false }));
      return;
    }
    fetchStatus();
  }, [enabled, fetchStatus]);

  return { ...status, claim, refetch: fetchStatus };
}
