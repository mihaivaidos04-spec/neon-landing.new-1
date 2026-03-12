"use client";

import { useState, useCallback, useEffect } from "react";
import {
  getSessionSpent,
  addSessionSpend as addSessionSpendStorage,
} from "../lib/spending-tiers";

export function useSessionSpending() {
  const [sessionSpent, setSessionSpent] = useState(0);

  useEffect(() => {
    setSessionSpent(getSessionSpent());
  }, []);

  const addSpend = useCallback((amount: number) => {
    if (amount <= 0) return;
    addSessionSpendStorage(amount);
    setSessionSpent((prev) => prev + amount);
  }, []);

  const isWhale = sessionSpent >= 2000; // WHALE_THRESHOLD_COINS

  return { sessionSpent, addSpend, isWhale };
}
