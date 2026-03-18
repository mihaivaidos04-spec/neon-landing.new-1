"use client";

import { useEffect, useState } from "react";
import { useSocketContext } from "../contexts/SocketContext";

export type LeaderboardEntry = {
  userId: string;
  totalSpent: number;
  rank: number;
  isGhostModeEnabled?: boolean;
  countryCode?: string | null;
};

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const { socket } = useSocketContext();

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const res = await fetch("/api/leaderboard");
        const data = await res.json().catch(() => ({}));
        if (data.leaderboard) {
          setLeaderboard(data.leaderboard);
        }
      } catch {
        setLeaderboard([]);
      }
    };

    fetchInitial();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onUpdate = (data: { leaderboard: LeaderboardEntry[] }) => {
      if (data.leaderboard) setLeaderboard(data.leaderboard);
    };

    socket.on("leaderboard_update", onUpdate);
    return () => {
      socket.off("leaderboard_update", onUpdate);
    };
  }, [socket]);

  const top1UserId = leaderboard[0]?.userId ?? null;

  return { leaderboard, top1UserId };
}
