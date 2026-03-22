"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

const GOOGLE_EXIT = "https://www.google.com";

type Props = {
  onAccept: () => void;
};

export default function AgeVerificationModal({ onAccept }: Props) {
  const [isLeaving, setIsLeaving] = useState(false);
  const deepParticles = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        id: i,
        left: 6 + i * 10.6,
        delay: i * 0.34,
        duration: 8 + (i % 4),
        drift: -14 + (i % 5) * 7,
      })),
    []
  );
  const foregroundCrystals = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        id: i,
        left: 10 + i * 15.2,
        delay: i * 0.28,
        duration: 5.4 + (i % 3) * 0.8,
        drift: -22 + (i % 4) * 12,
      })),
    []
  );

  return (
    <motion.div
      className="age-verify-overlay fixed inset-0 z-[210] flex flex-col overflow-y-auto overscroll-y-contain"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-verify-title"
      initial={{ opacity: 0 }}
      animate={isLeaving ? { opacity: 0, y: "-100%" } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="absolute inset-0">
        <div className="age-verify-overlay-bg absolute inset-0" />
        <div className="age-verify-overlay-vignette absolute inset-0" />
        <div className="age-verify-overlay-grain absolute inset-0" />
      </div>

      <div className="pointer-events-none absolute inset-0">
        {deepParticles.map((p) => (
          <motion.span
            key={`deep-${p.id}`}
            className="age-verify-particle-deep absolute top-[86%]"
            style={{ left: `${p.left}%` }}
            animate={{
              y: [0, -180],
              x: [0, p.drift],
              opacity: [0, 0.26, 0],
              scale: [0.7, 1.05, 0.78],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4 sm:p-6">
        <motion.div
          className="age-verify-shell relative w-full max-w-[42rem] overflow-hidden rounded-[1.9rem] p-[1px]"
          initial={{ opacity: 0, scale: 0.96, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="age-verify-frame-bevel absolute inset-[1px] rounded-[1.82rem]" />
          <div className="age-verify-panel relative rounded-[1.82rem] px-7 pb-8 pt-7 sm:px-10 sm:pb-10 sm:pt-9">
            <div className="pointer-events-none absolute inset-0">
              <div className="age-verify-panel-etch absolute inset-0 rounded-[1.82rem]" />
              <div className="age-verify-panel-light absolute inset-0 rounded-[1.82rem]" />
            </div>

            <div className="pointer-events-none absolute inset-0">
              {foregroundCrystals.map((p) => (
                <motion.span
                  key={`front-${p.id}`}
                  className="age-verify-crystal absolute top-[78%]"
                  style={{ left: `${p.left}%` }}
                  animate={{
                    y: [0, -120],
                    x: [0, p.drift],
                    opacity: [0, 0.42, 0],
                    scale: [0.8, 1.12, 0.86],
                  }}
                  transition={{
                    duration: p.duration,
                    repeat: Infinity,
                    delay: p.delay,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>

            <div className="relative">
              <h2
                id="age-verify-title"
                className="age-verify-title text-center text-[clamp(1.9rem,3.4vw,2.6rem)] font-extrabold uppercase"
              >
                Welcome to the Neon Realm
              </h2>
              <p className="age-verify-subtitle mx-auto mt-4 max-w-[33rem] text-center text-sm sm:text-base">
                A premium space for real-time connections and late-night vibes.
              </p>
              <p className="age-verify-copy mx-auto mt-[1.65rem] max-w-[33rem] text-center text-[0.94rem] font-medium leading-relaxed sm:text-[1.02rem]">
                Please confirm you are at least{" "}
                <span className="age-verify-age number-plain">18</span>{" "}
                years old to enter.
              </p>

              <div className="mt-[2.65rem] flex flex-col gap-3 sm:mt-[2.9rem] sm:flex-row sm:justify-center sm:gap-4">
                <motion.button
                  type="button"
                  onClick={() => {
                    if (isLeaving) return;
                    setIsLeaving(true);
                    window.setTimeout(() => onAccept(), 430);
                  }}
                  className="age-verify-btn-enter min-h-[52px] flex-1 rounded-[0.92rem] px-6 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-[#fff9ff]"
                  animate={{
                    boxShadow: [
                      "0 0 0 rgba(0,0,0,0), 0 0 30px rgba(199,41,174,0.35)",
                      "0 0 0 rgba(0,0,0,0), 0 0 48px rgba(223,60,188,0.62)",
                      "0 0 0 rgba(0,0,0,0), 0 0 30px rgba(199,41,174,0.35)",
                    ],
                  }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                >
                  Enter Neon
                </motion.button>
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = GOOGLE_EXIT;
                  }}
                  className="age-verify-btn-leave min-h-[52px] flex-1 rounded-[0.92rem] px-6 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-[#efe4ff]"
                >
                  Leave
                </button>
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-0 rounded-[1.9rem]">
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.span
                key={`edge-${i}`}
                className="age-verify-edge-spark absolute top-[12%]"
                style={{ left: `${16 + i * 16}%` }}
                animate={{ opacity: [0, 0.45, 0], y: [0, -8, -15] }}
                transition={{ duration: 2.8 + i * 0.3, repeat: Infinity, delay: i * 0.55, ease: "easeInOut" }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
