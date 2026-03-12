"use client";

import { useState, useEffect, useCallback } from "react";

export function useRewards(enabled: boolean) {
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCount = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/rewards");
      if (!res.ok) return;
      const data = await res.json();
      setPendingCount(data.pendingCount ?? 0);
    } catch {
      setPendingCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  return { pendingCount, isLoading, refetch: fetchCount };
}
