"use client";

import type { BundleId } from "../lib/checkout-bundles";
import { getBundleById, formatPrice } from "../lib/checkout-bundles";
import ExitIntentOffer, { hasSeenExitIntent } from "./ExitIntentOffer";
import { useCallback, useState } from "react";

type Props = {
  visible: boolean;
  onClose: () => void;
  bundleId: BundleId;
  userId?: string;
  userName?: string;
  onSuccess: () => void;
};

export default function PaymentModal({
  visible,
  onClose,
  bundleId,
  onSuccess,
}: Props) {
  const [exitIntentVisible, setExitIntentVisible] = useState(false);

  const handleCloseAttempt = useCallback(() => {
    if (hasSeenExitIntent()) {
      onClose();
    } else {
      setExitIntentVisible(true);
    }
  }, [onClose]);

  const handleExitIntentStay = useCallback(() => {
    setExitIntentVisible(false);
  }, []);

  const handleExitIntentClose = useCallback(() => {
    setExitIntentVisible(false);
    onClose();
  }, [onClose]);

  if (!visible) return null;

  const bundle = getBundleById(bundleId);

  return (
    <>
      <div
        className="fixed inset-0 z-[400] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && handleCloseAttempt()}
      >
        <div
          className="modal-neon w-full max-w-md rounded-2xl border border-white/10 p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">
                {bundle.name} · {bundle.totalCoins} Bănuți
              </h3>
              <p className="text-sm text-emerald-400">
                {formatPrice(bundle.price)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCloseAttempt}
              className="rounded-full p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="flex min-h-[160px] flex-col items-center justify-center gap-4 rounded-xl border border-white/10 bg-white/5 p-6 text-center">
            <p className="text-base font-medium text-white/90">
              Plată în curând
            </p>
            <p className="text-sm text-white/60">
              Integrarea Lemon Squeezy este în curs. Plățile vor fi disponibile în curând.
            </p>
          </div>
        </div>
      </div>
      <ExitIntentOffer
        visible={exitIntentVisible}
        onStay={handleExitIntentStay}
        onClose={handleExitIntentClose}
      />
    </>
  );
}
