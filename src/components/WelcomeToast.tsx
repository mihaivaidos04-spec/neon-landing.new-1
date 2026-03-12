"use client";

import { useEffect, useState } from "react";
type Props = {
  message: string;
  onDismiss?: () => void;
};

const TOAST_DURATION_MS = 5000;

export default function WelcomeToast({ message, onDismiss }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, TOAST_DURATION_MS);
    return () => clearTimeout(id);
  }, [onDismiss]);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-4 left-4 z-[60] max-w-[320px] rounded-xl border border-emerald-400/30 bg-black/90 px-4 py-3 shadow-[0_0_24px_rgba(74,222,128,0.2)] sm:bottom-6 sm:left-6"
      role="status"
      aria-live="polite"
    >
      <p className="text-sm font-medium text-white">{message}</p>
    </div>
  );
}
