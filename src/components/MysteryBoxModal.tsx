"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  MYSTERY_BOX_COST,
  MYSTERY_BOX_SMALL_REWARD,
  MYSTERY_BOX_BIG_REWARD,
} from "../lib/coins";
import { playDrumrollSound, playExplosionSound, playGiftSound } from "../lib/feedback";
import type { MysteryBoxResult } from "../app/api/mystery-box/open/route";

type Props = {
  visible: boolean;
  onClose: () => void;
  coins: number;
  onSpend?: (amount: number, reason?: string) => Promise<boolean>;
  setCoins?: (fn: (prev: number) => number) => void;
  onOpenShop?: () => void;
  onWalletRefetch?: () => void | Promise<void>;
  onBatteryBonus?: (amount: number) => void;
  onZeroDrain?: (minutes: number) => void;
};

function rollClient(): MysteryBoxResult {
  const r = Math.random();
  if (r < 0.35) return "coins_small";
  if (r < 0.45) return "coins_big";
  if (r < 0.7) return "battery_bonus";
  if (r < 0.8) return "sticker";
  if (r < 0.9) return "zero_drain";
  return "nothing";
}

function fireConfetti() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#8b5cf6", "#a78bfa", "#fbbf24", "#34d399", "#f472b6"],
  });
  setTimeout(() => {
    confetti({
      particleCount: 40,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ["#8b5cf6", "#fbbf24"],
    });
  }, 150);
  setTimeout(() => {
    confetti({
      particleCount: 40,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ["#8b5cf6", "#fbbf24"],
    });
  }, 250);
}

export default function MysteryBoxModal({
  visible,
  onClose,
  coins,
  onSpend,
  setCoins,
  onOpenShop,
  onWalletRefetch,
  onBatteryBonus,
  onZeroDrain,
}: Props) {
  const [phase, setPhase] = useState<"idle" | "shake_glow" | "opening" | "reveal">("idle");
  const [result, setResult] = useState<MysteryBoxResult | null>(null);
  const [coinsWon, setCoinsWon] = useState(0);
  const [batteryBonus, setBatteryBonus] = useState(0);
  const [zeroDrainMinutes, setZeroDrainMinutes] = useState(0);

  const canAfford = coins >= MYSTERY_BOX_COST;

  const handleOpen = useCallback(async () => {
    if (!canAfford) {
      onOpenShop?.();
      return;
    }
    if (!onSpend && !setCoins) {
      onOpenShop?.();
      return;
    }

    setPhase("shake_glow");
    playDrumrollSound();

    await new Promise((r) => setTimeout(r, 2000));

    let prize: MysteryBoxResult = "nothing";

    if (onSpend) {
      const res = await fetch("/api/mystery-box/open", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) {
        prize = data?.prize ?? "nothing";
        await onWalletRefetch?.();
        setResult(prize);
        setCoinsWon(data?.coinsWon ?? 0);
        setBatteryBonus(data?.batteryBonus ?? 0);
        setZeroDrainMinutes(data?.zeroDrainMinutes ?? 0);
        onBatteryBonus?.(data?.batteryBonus ?? 0);
        onZeroDrain?.(data?.zeroDrainMinutes ?? 0);
        if (typeof window !== "undefined") {
          if ((data?.batteryBonus ?? 0) > 0) {
            window.dispatchEvent(new CustomEvent("mystery-box-battery", { detail: { amount: data.batteryBonus } }));
          }
          if ((data?.zeroDrainMinutes ?? 0) > 0) {
            window.dispatchEvent(new CustomEvent("mystery-box-zero-drain", { detail: { minutes: data.zeroDrainMinutes } }));
          }
        }
      } else {
        setPhase("idle");
        return;
      }
    } else if (setCoins) {
      prize = rollClient();
      setResult(prize);
      const won = prize === "coins_small" ? MYSTERY_BOX_SMALL_REWARD : prize === "coins_big" ? MYSTERY_BOX_BIG_REWARD : 0;
      setCoinsWon(won);
      setBatteryBonus(prize === "battery_bonus" ? 10 : 0);
      setZeroDrainMinutes(prize === "zero_drain" ? 2 : 0);
      if (won > 0) setCoins((c) => c + won);
      if (prize === "battery_bonus") {
        onBatteryBonus?.(10);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("mystery-box-battery", { detail: { amount: 10 } }));
        }
      }
      if (prize === "zero_drain") {
        onZeroDrain?.(2);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("mystery-box-zero-drain", { detail: { minutes: 2 } }));
        }
      }
    }

    setPhase("opening");
    await new Promise((r) => setTimeout(r, 1800));
    playExplosionSound();
    if (prize !== "nothing") {
      fireConfetti();
      playGiftSound();
    }
    setPhase("reveal");
  }, [canAfford, onSpend, setCoins, onWalletRefetch, onOpenShop, onBatteryBonus, onZeroDrain]);

  const handleClose = useCallback(() => {
    setPhase("idle");
    setResult(null);
    setCoinsWon(0);
    setBatteryBonus(0);
    setZeroDrainMinutes(0);
    onClose();
  }, [onClose]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && phase === "idle" && handleClose()}
      >
        <motion.div
          className="modal-neon relative w-full max-w-xl overflow-hidden rounded-2xl border border-amber-500/30 p-6 shadow-2xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="mb-4 text-center text-xl font-bold text-amber-400">
            Mystery Box
          </h3>

          {phase === "idle" && (
            <div className="flex flex-col items-center gap-6">
              <div className="relative h-32 w-32">
                <div
                  className="absolute inset-0 rounded-xl border-2 border-amber-600/60 bg-gradient-to-br from-amber-900/80 to-amber-950 shadow-lg"
                  style={{ boxShadow: "inset 0 0 30px rgba(251,191,36,0.2)" }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-5xl">
                  📦
                </div>
              </div>
              <p className="text-center text-sm text-white/70">
                {MYSTERY_BOX_COST} coins • 60% small, 5% big, 35% other rewards
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-medium text-white/80"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleOpen()}
                  disabled={!canAfford}
                  className="rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-bold text-black transition-colors hover:bg-amber-400 disabled:opacity-50"
                >
                  Open ({MYSTERY_BOX_COST})
                </button>
              </div>
            </div>
          )}

          {phase === "shake_glow" && (
            <div className="flex flex-col items-center gap-6 py-4">
              <motion.div
                className="mystery-box-shake relative h-32 w-32"
                animate={{
                  x: [0, -8, 8, -6, 6, -4, 4, 0],
                  boxShadow: [
                    "0 0 20px rgba(251,191,36,0.3)",
                    "0 0 40px rgba(251,191,36,0.6)",
                    "0 0 60px rgba(251,191,36,0.8)",
                    "0 0 80px rgba(251,191,36,0.9)",
                    "0 0 100px rgba(251,191,36,1)",
                  ],
                }}
                transition={{
                  x: { duration: 2, times: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1] },
                  boxShadow: { duration: 2 },
                }}
              >
                <div
                  className="absolute inset-0 rounded-xl border-2 border-amber-500/80 bg-gradient-to-br from-amber-800/90 to-amber-950"
                  style={{ boxShadow: "inset 0 0 40px rgba(251,191,36,0.4)" }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-5xl">
                  📦
                </div>
              </motion.div>
              <p className="animate-pulse text-sm text-amber-400/90">
                Shaking... Get ready!
              </p>
            </div>
          )}

          {phase === "opening" && (
            <div className="flex flex-col items-center gap-6 py-4">
              <div className="relative h-32 w-32">
                <div
                  className="absolute inset-0 rounded-xl border-2 border-amber-600/60 bg-gradient-to-br from-amber-900/80 to-amber-950"
                  style={{ boxShadow: "inset 0 0 30px rgba(251,191,36,0.3)" }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-5xl">
                  ✨
                </div>
              </div>
              <p className="animate-pulse text-sm text-amber-400/90">
                Opening...
              </p>
            </div>
          )}

          {phase === "reveal" && result && (
            <motion.div
              className="flex flex-col items-center gap-6 py-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <div
                className={`rounded-2xl px-6 py-4 text-center ${
                  result === "coins_big"
                    ? "bg-amber-500/20 ring-2 ring-amber-400/60"
                    : result === "coins_small"
                    ? "bg-emerald-500/20 ring-2 ring-emerald-400/60"
                    : result === "battery_bonus"
                    ? "bg-cyan-500/20 ring-2 ring-cyan-400/60"
                    : result === "sticker"
                    ? "bg-purple-500/20 ring-2 ring-purple-400/60"
                    : result === "zero_drain"
                    ? "bg-violet-500/20 ring-2 ring-violet-400/60"
                    : "bg-zinc-700/30 ring-2 ring-zinc-500/40"
                }`}
              >
                {result !== "nothing" && (
                  <p className="mb-2 text-lg font-bold text-white">You Won!</p>
                )}
                {result === "coins_big" && (
                  <p className="text-2xl font-bold text-amber-400">
                    JACKPOT! +{coinsWon} coins!
                  </p>
                )}
                {result === "coins_small" && (
                  <p className="text-xl font-bold text-emerald-400">
                    +{coinsWon} coins!
                  </p>
                )}
                {result === "battery_bonus" && (
                  <p className="text-xl font-bold text-cyan-400">
                    +{batteryBonus}% Battery
                  </p>
                )}
                {result === "sticker" && (
                  <p className="text-xl font-bold text-purple-400">
                    Rare Profile Sticker Unlocked!
                  </p>
                )}
                {result === "zero_drain" && (
                  <p className="text-xl font-bold text-violet-400">
                    {zeroDrainMinutes} min Zero-Drain Mode!
                  </p>
                )}
                {result === "nothing" && (
                  <p className="text-lg font-medium text-white/80">
                    Better luck next time!
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl bg-[#8b5cf6] px-6 py-2.5 text-sm font-semibold text-white"
              >
                Claim Reward
              </button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
