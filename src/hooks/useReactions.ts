"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowser } from "../lib/supabase-browser";
import type { ReactionId } from "../lib/reactions";

/**
 * Subscribes to reactions sent to the current user via Supabase Realtime.
 * Returns the latest reaction to display (and a clear function).
 */
export function useReactions(userId: string | null) {
  const [reaction, setReaction] = useState<ReactionId | null>(null);

  const clearReaction = useCallback(() => setReaction(null), []);

  useEffect(() => {
    if (!userId) return;

    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    const channel = supabase
      .channel("reactions-incoming")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "reactions",
          filter: `to_user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as { reaction_type?: string };
          const type = row?.reaction_type;
          if (type && ["heart", "fire", "laugh", "love", "wow"].includes(type)) {
            setReaction(type as ReactionId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { reaction, clearReaction };
}
