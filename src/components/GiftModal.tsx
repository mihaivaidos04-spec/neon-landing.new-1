"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { sendGift, type GiftType } from "@/src/app/actions/gift";
import { formatNumber } from "../lib/format-intl";
import GiftAssetIcon from "./GiftAssetIcon";

const GIFTS: { id: GiftType; label: string; cost: number }[] = [
  { id: "heart", label: "Heart", cost: 5 },
  { id: "fire", label: "Fire", cost: 50 },
  { id: "rocket", label: "Rocket", cost: 500 },
];

type Props = {
  open: boolean;
  onClose: () => void;
  receiverId: string;
  receiverName?: string;
  coins: number;
  onSuccess?: (newBalance: number) => void;
};

export default function GiftModal({
  open,
  onClose,
  receiverId,
  receiverName = "User",
  coins,
  onSuccess,
}: Props) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState<GiftType | null>(null);

  if (!open) return null;

  const handleSend = async (giftType: GiftType) => {
    const gift = GIFTS.find((g) => g.id === giftType);
    if (!gift || coins < gift.cost) {
      toast.error(`You need ${gift?.cost ?? 0} coins.`);
      return;
    }
    setLoading(giftType);
    try {
      const result = await sendGift(receiverId, giftType);
      if (result.success) {
        toast.success(`Sent ${gift.label} to ${receiverName}!`);
        onSuccess?.(result.newBalance);
        onClose();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to send gift.");
    } finally {
      setLoading(null);
    }
  };

  const userId = (session as any)?.userId ?? session?.user?.id;
  if (!userId) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0a0a0d] p-6 shadow-2xl">
          <p className="text-center text-white/80">Sign in to send gifts</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full rounded-xl bg-violet-600 py-2.5 font-semibold text-white"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-sm rounded-2xl border border-violet-500/30 bg-[#0a0a0d] p-6 shadow-[0_0_40px_rgba(139,92,246,0.15)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gift-modal-title"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="gift-modal-title" className="text-lg font-semibold text-white">
            Send gift to {receiverName}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <p className="mb-4 text-sm text-white/60">
          Your balance:{" "}
          <span className="premium-number-glow number-plain">
            {formatNumber(coins)} coins
          </span>
        </p>
        <div className="flex flex-col gap-3">
          {GIFTS.map((g) => {
            const canAfford = coins >= g.cost;
            const isDisabled = loading !== null || !canAfford;
            return (
              <button
                key={g.id}
                type="button"
                disabled={isDisabled}
                onClick={() => handleSend(g.id)}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left transition-all hover:border-violet-500/40 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="gift-emoji-future-wrap shrink-0">
                    <GiftAssetIcon id={g.id} size={28} />
                  </span>
                  <span className="font-medium text-white">{g.label}</span>
                  <span className="gift-price-text text-sm text-white/50">{g.cost.toLocaleString("en-US")} coins</span>
                </span>
                {loading === g.id ? (
                  <span className="text-xs text-violet-400">Sending...</span>
                ) : (
                  <span className="text-xs text-violet-400">Send</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
