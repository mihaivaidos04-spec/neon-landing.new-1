"use client";

import { useState, useEffect, useCallback } from "react";

const POLL_INTERVAL_MS = 5000;

export type UseMissionResult = {
  count: number;
  completed: boolean;
  taskType: "connections" | "messages";
  isLoading: boolean;
  refetch: () => Promise<void>;
  increment: (connectionDurationMs: number) => Promise<{ count: number; completed: boolean; justCompleted: boolean } | null>;
};

export function useMission(enabled: boolean = true): UseMissionResult {
  const [count, setCount] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [taskType, setTaskType] = useState<"connections" | "messages">("connections");
  const [isLoading, setIsLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/missions");
      if (!res.ok) {
        if (res.status === 401) {
          setCount(0);
          setCompleted(false);
        }
        setIsLoading(false);
        return;
      }
      const data = await res.json();
      setCount(data.count ?? 0);
      setCompleted(data.completed ?? false);
      setTaskType(data.taskType ?? "connections");
    } catch {
      setCount(0);
      setCompleted(false);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(fetchProgress, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [enabled, fetchProgress]);

  const increment = useCallback(async (connectionDurationMs: number) => {
    if (!enabled) return null;
    try {
      const res = await fetch("/api/missions/increment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionDurationMs }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      setCount(data.count ?? 0);
      setCompleted(data.completed ?? false);
      return { count: data.count, completed: data.completed, justCompleted: data.justCompleted };
    } catch {
      return null;
    }
  }, [enabled]);

  return { count, completed, taskType, isLoading, refetch: fetchProgress, increment };
}
