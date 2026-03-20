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

/** Neon holo crate — rotating conic rim + scan + grid */
function FuturisticMysteryBox({
  emoji,
  intense = false,
}: {
  emoji: string;
  intense?: boolean;
}) {
  return (
    <div className="relative h-36 w-36 sm:h-40 sm:w-40">
      <motion.div
        className="absolute -inset-[3px] rounded-2xl blur-[0.5px]"
        style={{
          background:
            "conic-gradient(from 90deg at 50% 50%, #06b6d4, #8b5cf6, #ec4899, #22d3ee, #a855f7, #06b6d4)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: intense ? 2.2 : 5.5, repeat: Infinity, ease: "linear" }}
      />
      <div className="absolute inset-[2px] overflow-hidden rounded-[0.85rem] bg-gradient-to-br from-[#0a0614] via-[#050508] to-[#0c1020] shadow-[inset_0_0_50px_rgba(139,92,246,0.12)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(34,211,238,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.35) 1px, transparent 1px)",
            backgroundSize: "12px 12px",
          }}
        />
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[0.85rem]">
          <div
            className="mystery-holo-sweep absolute left-0 right-0 top-0 h-[45%] bg-gradient-to-b from-cyan-400/35 via-fuchsia-400/15 to-transparent blur-md"
            aria-hidden
          />
        </div>
        <div className="pointer-events-none absolute inset-0 rounded-[0.85rem] border border-cyan-400/20 shadow-[inset_0_0_24px_rgba(6,182,212,0.08)]" />
        <div className="relative flex h-full w-full items-center justify-center">
          <span
            className={`mystery-box-emoji select-none text-5xl sm:text-6xl ${intense ? "scale-110" : ""}`}
            aria-hidden
          >
            {emoji}
          </span>
        </div>
      </div>
    </div>
  );
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
          className="modal-neon relative w-full max-w-xl overflow-hidden rounded-2xl border border-cyan-500/25 bg-[#040408]/95 p-6 shadow-[0_0_60px_rgba(6,182,212,0.12),0_0_100px_rgba(139,92,246,0.08)] ring-1 ring-fuchsia-500/20 backdrop-blur-md"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="mb-1 text-center text-xl font-bold tracking-wide text-transparent bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-violet-300 bg-clip-text">
            Mystery Box
          </h3>
          <p className="mb-4 text-center text-[10px] font-medium uppercase tracking-[0.35em] text-cyan-400/50">
            Neural drop • live odds
          </p>

          {phase === "idle" && (
            <div className="flex flex-col items-center gap-6">
              <FuturisticMysteryBox emoji="📦" />
              <p className="text-center text-sm text-white/65">
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
                  className="rounded-xl bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-violet-600 px-6 py-2.5 text-sm font-bold text-white shadow-[0_0_24px_rgba(236,72,153,0.35)] transition-all hover:brightness-110 disabled:opacity-50"
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
              <motion.div
                animate={{ scale: [1, 1.08, 1], opacity: [1, 0.92, 1] }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
              >
                <FuturisticMysteryBox emoji="✨" intense />
              </motion.div>
              <p className="animate-pulse text-sm font-medium text-cyan-300/90">
                Materializing reward stream…
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
