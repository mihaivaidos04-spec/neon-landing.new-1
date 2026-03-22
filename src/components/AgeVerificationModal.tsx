"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

const GOOGLE_EXIT = "https://www.google.com";

type Props = {
  onAccept: () => void;
};

export default function AgeVerificationModal({ onAccept }: Props) {
  const [isLeaving, setIsLeaving] = useState(false);
  const particleSpecs = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        left: 8 + i * 11,
        delay: i * 0.18,
        duration: 4 + (i % 3),
      })),
    []
  );

  return (
    <motion.div
      className="fixed inset-0 z-[210] flex flex-col overflow-y-auto overscroll-y-contain bg-[#030308]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-verify-title"
      initial={{ opacity: 0 }}
      animate={isLeaving ? { opacity: 0, y: "-100%" } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-black/95" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(217,70,239,0.24),transparent_52%),radial-gradient(ellipse_at_bottom,rgba(99,102,241,0.22),transparent_56%)]" />
        <div className="absolute inset-0 backdrop-blur-xl" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <motion.div
          className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-fuchsia-300/25 bg-white/10 p-7 shadow-[0_0_40px_rgba(217,70,239,0.3),0_24px_70px_rgba(0,0,0,0.6)] backdrop-blur-2xl sm:p-10"
          initial={{ opacity: 0, scale: 0.96, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="pointer-events-none absolute inset-0">
            {particleSpecs.map((p) => (
              <motion.span
                key={p.id}
                className="absolute top-[80%] h-1.5 w-1.5 rounded-full bg-fuchsia-300/70 blur-[0.5px]"
                style={{ left: `${p.left}%` }}
                animate={{ y: [-4, -60], opacity: [0, 0.85, 0], scale: [0.9, 1.2, 0.9] }}
                transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
              />
            ))}
          </div>

          <h2
            id="age-verify-title"
            className="text-center text-3xl font-extrabold uppercase tracking-[0.1em] text-fuchsia-100 sm:text-4xl"
            style={{
              fontFamily: "var(--font-orbitron), var(--font-syne), system-ui, sans-serif",
              textShadow:
                "0 0 16px rgba(244,114,182,0.8), 0 0 28px rgba(236,72,153,0.5)",
            }}
          >
            Welcome to the Neon Realm
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-center text-sm text-white/80 sm:text-base">
            A premium space for real-time connections and late-night vibes.
          </p>
          <p className="mx-auto mt-5 max-w-lg text-center text-sm font-medium text-fuchsia-100/95 sm:text-base">
            Please confirm you are at least 18 years old to enter.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <motion.button
              type="button"
              onClick={() => {
                if (isLeaving) return;
                setIsLeaving(true);
                window.setTimeout(() => onAccept(), 430);
              }}
              className="min-h-[50px] flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-[0_0_28px_rgba(217,70,239,0.45)]"
              animate={{ boxShadow: ["0 0 18px rgba(168,85,247,0.35)", "0 0 34px rgba(236,72,153,0.55)", "0 0 18px rgba(168,85,247,0.35)"] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            >
              Enter Neon
            </motion.button>
            <button
              type="button"
              onClick={() => {
                window.location.href = GOOGLE_EXIT;
              }}
              className="min-h-[50px] flex-1 rounded-xl border border-fuchsia-300/35 bg-transparent px-6 py-3 text-sm font-semibold uppercase tracking-wide text-fuchsia-100/90 hover:border-fuchsia-300/60 hover:bg-fuchsia-500/10"
            >
              Leave
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
