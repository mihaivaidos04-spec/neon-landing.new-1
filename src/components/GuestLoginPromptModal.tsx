"use client";

import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function GuestLoginPromptModal({ open, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[520] bg-black/55 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            className="fixed inset-x-4 bottom-6 z-[530] mx-auto w-full max-w-xl rounded-2xl border border-fuchsia-400/30 bg-[#090812]/92 p-5 shadow-[0_0_36px_rgba(217,70,239,0.3)] backdrop-blur-xl sm:bottom-8 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label="Login to unlock interactions"
            initial={{ opacity: 0, y: 26, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
          >
            <p className="text-center text-sm font-semibold text-fuchsia-100 sm:text-base">
              You&apos;re vibing! Log in with Discord or Google to start chatting and sending gifts.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => void signIn("discord", { callbackUrl: "/dashboard" })}
                className="min-h-[46px] flex-1 rounded-xl bg-[#5865F2] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(88,101,242,0.45)]"
              >
                Continue with Discord
              </button>
              <button
                type="button"
                onClick={() => void signIn("google", { callbackUrl: "/dashboard" })}
                className="min-h-[46px] flex-1 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#111827]"
              >
                Continue with Google
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full rounded-xl border border-white/15 px-4 py-2 text-xs font-medium text-white/65"
            >
              Maybe later
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
