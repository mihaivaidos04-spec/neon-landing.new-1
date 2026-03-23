"use client";

import { motion, AnimatePresence } from "framer-motion";

type Props = {
  visible: boolean;
  onClose: () => void;
  stats: {
    peopleTalkedTo: number;
    giftsReceived: number;
    minutesOnline: number;
  };
};

export default function SessionSummaryModal({
  visible,
  onClose,
  stats,
}: Props) {
  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="modal-neon w-full max-w-md rounded-2xl border border-[#8b5cf6]/40 p-8 shadow-2xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <h2 className="mb-6 text-center text-2xl font-bold text-white">
            Session Summary
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
              <span className="text-white/80">Talked to new people</span>
              <span className="text-xl font-bold tabular-nums text-[var(--color-text-secondary)]">
                {stats.peopleTalkedTo}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
              <span className="text-white/80">Gifts received</span>
              <span className="text-xl font-bold tabular-nums text-[var(--color-text-secondary)]">
                {stats.giftsReceived}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
              <span className="text-white/80">Online for</span>
              <span className="text-xl font-bold tabular-nums text-[var(--color-text-secondary)]">
                {stats.minutesOnline} min
              </span>
            </div>
          </div>
          <div className="mt-8 rounded-xl bg-amber-500/20 p-4 text-center">
            <p className="text-lg font-semibold text-amber-300">
              Come back tomorrow for your Daily Bonus!
            </p>
            <p className="mt-1 text-sm text-white/70">
              Log in to claim your streak reward
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full rounded-full bg-[#8b5cf6] py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-95"
          >
            Got it!
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
