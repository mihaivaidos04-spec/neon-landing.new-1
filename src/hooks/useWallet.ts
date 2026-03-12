"use client";

import { useState, useEffect, useCallback } from "react";

export type UseWalletResult = {
  balance: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

const REFETCH_INTERVAL_MS = 10_000;

export function useWallet(enabled: boolean = true): UseWalletResult {
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    try {
      setError(null);
      const res = await fetch("/api/wallet");
      if (!res.ok) {
        if (res.status === 401) {
          setBalance(0);
          setIsLoading(false);
          return;
        }
        throw new Error("Failed to fetch wallet");
      }
      const data = await res.json();
      setBalance(data.balance ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setBalance(0);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(fetchBalance, REFETCH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [enabled, fetchBalance]);

  return { balance, isLoading, error, refetch: fetchBalance };
}
