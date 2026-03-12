"use client";

import { useEffect, useRef, useState } from "react";
import MicroAd from "./MicroAd";

const AD_DURATION_SEC = 5;

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function VideoAdOverlay({ visible, onClose }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(AD_DURATION_SEC);
  const closedRef = useRef(false);

  useEffect(() => {
    if (!visible) {
      setSecondsLeft(AD_DURATION_SEC);
      closedRef.current = false;
      return;
    }
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1 && !closedRef.current) {
          closedRef.current = true;
          onClose();
          return 0;
        }
        return prev <= 0 ? 0 : prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl bg-black/95 backdrop-blur-sm"
      role="dialog"
      aria-label="Reclamă"
    >
      <div className="flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4">
        <MicroAd format="rectangle" />
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/60">
            {secondsLeft}s
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
          >
            Închide
          </button>
        </div>
      </div>
    </div>
  );
}
