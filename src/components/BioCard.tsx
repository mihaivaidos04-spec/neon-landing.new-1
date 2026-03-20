"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sanitizeForDisplay } from "../lib/text-moderation";
import type { ContentLocale } from "../lib/content-i18n";
import UserNameWithFlag from "./UserNameWithFlag";

type Props = {
  partnerName?: string;
  partnerCountryCode?: string | null;
  locale?: ContentLocale;
  interests?: string[];
  totalGiftsReceived?: number;
  visible: boolean;
  onDismiss?: () => void;
};

const DEFAULT_INTERESTS = ["Music", "Travel", "Photography", "Coffee", "Movies"];

export default function BioCard({
  partnerName = "Partner",
  partnerCountryCode = null,
  locale = "en",
  interests = DEFAULT_INTERESTS,
  totalGiftsReceived = 0,
  visible,
  onDismiss,
}: Props) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (visible && !dismissed) {
      const t = setTimeout(() => setDismissed(true), 5000);
      return () => clearTimeout(t);
    }
  }, [visible, dismissed]);

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (!visible || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="absolute left-3 top-12 z-30 w-48 rounded-xl border border-white/20 bg-black/90 px-3 py-2.5 shadow-xl backdrop-blur-md"
        initial={{ x: -120, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -120, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <UserNameWithFlag
              name={sanitizeForDisplay(partnerName)}
              countryCode={partnerCountryCode}
              locale={locale}
              nameClassName="text-xs font-semibold text-white/90"
            />
            <p className="mt-1 text-[10px] text-white/60">Interests</p>
            <p className="text-[11px] text-white/80">
              {interests.slice(0, 3).map((i) => sanitizeForDisplay(i)).join(" · ")}
            </p>
            <p className="mt-1.5 text-[10px] text-amber-400/90">
              {totalGiftsReceived} gifts received
            </p>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded p-1 text-white/50 hover:bg-white/10 hover:text-white"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
