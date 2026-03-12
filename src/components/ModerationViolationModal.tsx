"use client";

import { motion, AnimatePresence } from "framer-motion";

type Props = {
  visible: boolean;
};

const MESSAGE = "Violation detected. Your account is flagged.";

export default function ModerationViolationModal({ visible }: Props) {
  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-red-500/60 bg-red-950/40 p-6 shadow-2xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <div className="mb-4 flex items-center gap-2 text-red-400">
            <span className="text-2xl">⚠️</span>
            <h3 className="text-lg font-bold">Account Flagged</h3>
          </div>
          <p className="text-sm leading-relaxed text-white/90">{MESSAGE}</p>
          <p className="mt-4 text-xs text-white/50">
            Your access to matching has been suspended. Contact support if you believe this was an error.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
