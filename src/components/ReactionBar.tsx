"use client";

import { motion } from "framer-motion";
import type { ContentLocale } from "../lib/content-i18n";
import { REACTIONS } from "../lib/reactions";
import type { ReactionId } from "../lib/reactions";
import { getReactionCost } from "../lib/coins";

type Props = {
  locale: ContentLocale;
  coins: number;
  onSendReaction: (reactionId: ReactionId) => void;
  disabled?: boolean;
};

export default function ReactionBar({
  locale: _locale,
  coins,
  onSendReaction,
  disabled = false,
}: Props) {
  return (
    <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
      {REACTIONS.map((r) => {
        const cost = getReactionCost(r.id);
        const canAfford = coins >= cost;
        return (
          <motion.button
            key={r.id}
            type="button"
            onClick={() => canAfford && !disabled && onSendReaction(r.id)}
            disabled={disabled || !canAfford}
            className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-xl border border-white/10 bg-transparent px-3 py-2 text-white/70 transition-all active:scale-[0.96] hover:border-[#8b5cf6]/40 hover:bg-[#8b5cf6]/10 hover:text-white/95 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-white/10"
            whileHover={canAfford && !disabled ? { scale: 1.08 } : {}}
            whileTap={canAfford && !disabled ? { scale: 0.95 } : {}}
          >
            <span className="emoji-ios text-xl">{r.emoji}</span>
            <span className="premium-number-glow number-plain text-[9px] font-medium">{cost.toLocaleString("en-US")}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
