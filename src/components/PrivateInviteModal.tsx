"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { ContentLocale } from "../lib/content-i18n";
import { getContentT } from "../lib/content-i18n";

type Props = {
  locale: ContentLocale;
  visible: boolean;
  fromUserId: string;
  roomId: string;
  onAccept: () => void;
  onDecline: () => void;
};

export default function PrivateInviteModal({
  locale,
  visible,
  fromUserId,
  roomId,
  onAccept,
  onDecline,
}: Props) {
  const t = getContentT(locale);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onDecline()}
      >
        <motion.div
          className="modal-neon w-full max-w-sm rounded-2xl border border-white/20 p-6 shadow-xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="mb-2 text-lg font-semibold text-white">
            {t.privateInviteTitle}
          </h3>
          <p className="mb-6 text-sm text-white/70">
            {t.privateInviteMessage}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onDecline}
              className="flex-1 rounded-xl border border-white/20 px-4 py-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/10"
            >
              {t.privateInviteDecline}
            </button>
            <button
              type="button"
              onClick={onAccept}
              className="flex-1 rounded-xl bg-[#8b5cf6] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#7c3aed]"
            >
              {t.privateInviteAccept}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
