"use client";

import { useState, useEffect, useCallback } from "react";

const SCAN_DURATION_MS = 2000;

type Props = {
  visible: boolean;
  onClose: () => void;
  onDecrypted: () => void;
};

type Phase = "idle" | "scanning" | "reveal" | "error";

export default function DecryptRewardModal({
  visible,
  onClose,
  onDecrypted,
}: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [rewardLabel, setRewardLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startDecrypt = useCallback(async () => {
    setPhase("scanning");
    setProgress(0);
    setRewardLabel(null);
    setError(null);

    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(100, (elapsed / SCAN_DURATION_MS) * 100);
      setProgress(p);
      if (p >= 100) clearInterval(interval);
    }, 50);

    await new Promise((r) => setTimeout(r, SCAN_DURATION_MS));
    clearInterval(interval);
    setProgress(100);

    try {
      const res = await fetch("/api/rewards/decrypt", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to decrypt");
        setPhase("error");
        return;
      }
      setRewardLabel(data.label ?? "Reward unlocked!");
      setPhase("reveal");
      onDecrypted();
    } catch (e) {
      setError("Request failed");
      setPhase("error");
    }
  }, [onDecrypted]);

  const handleClose = useCallback(() => {
    setPhase("idle");
    setProgress(0);
    setRewardLabel(null);
    setError(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (visible && phase === "idle") {
      startDecrypt();
    }
  }, [visible, phase, startDecrypt]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && phase !== "scanning" && handleClose()}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-black/90 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {phase === "scanning" && (
          <>
            <p className="text-center text-sm font-medium text-white/90">
              Scanning encrypted data...
            </p>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        )}
        {phase === "reveal" && rewardLabel && (
          <>
            <div className="text-center">
              <p className="text-lg font-semibold text-emerald-400">Reward Unlocked!</p>
              <p className="mt-2 text-2xl font-bold text-white">{rewardLabel}</p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="mt-6 w-full rounded-full bg-emerald-500 py-3 text-sm font-semibold text-black transition-opacity hover:bg-emerald-400"
            >
              Done
            </button>
          </>
        )}
        {phase === "error" && (
          <>
            <p className="text-center text-sm text-red-400">{error}</p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-4 w-full rounded-full border border-white/20 py-3 text-sm font-medium text-white"
            >
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
}
