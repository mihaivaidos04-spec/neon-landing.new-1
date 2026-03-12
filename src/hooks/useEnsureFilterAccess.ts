"use client";

import { useCallback } from "react";
import { FILTER_SKIP_COST } from "../lib/coins";
import type { FilterType } from "../lib/access";

type Options = {
  onDenied: () => void;
  onSpend?: (amount: number, reason?: string) => Promise<boolean>;
  onRefetch?: () => Promise<void>;
};

/**
 * Returns a function that checks access before a filtered skip.
 * If denied, calls onDenied (opens Bănuți & Passuri modal).
 * If allowed via coins, spends 5 and refetches.
 */
export function useEnsureFilterAccess(options: Options) {
  const { onDenied, onSpend, onRefetch } = options;

  return useCallback(
    async (filterType: FilterType): Promise<boolean> => {
      const res = await fetch("/api/access/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filterType }),
      });
      const data = await res.json();

      if (data.allowed) {
        if (data.viaCoins && onSpend) {
          const ok = await onSpend(FILTER_SKIP_COST, "filtered_skip");
          if (!ok) return false;
          await onRefetch?.();
        }
        return true;
      }

      onDenied();
      return false;
    },
    [onDenied, onSpend, onRefetch]
  );
}
