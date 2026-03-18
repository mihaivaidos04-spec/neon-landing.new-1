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
      className="fixed left-1/2 top-1/2 z-[60] w-full max-w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-violet-500/50 bg-black/95 px-6 py-5 shadow-[0_0_48px_rgba(139,92,246,0.4),0_0_24px_rgba(57,255,20,0.15)] backdrop-blur-xl"
      role="status"
      aria-live="polite"
    >
      <p className="text-center text-base font-semibold text-white">{message}</p>
    </div>
  );
}
