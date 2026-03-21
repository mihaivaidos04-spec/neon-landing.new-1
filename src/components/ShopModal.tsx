"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import toast from "react-hot-toast";
import { buyItem } from "@/src/app/actions/shop";
import { getShopItems, type ShopItem } from "@/src/lib/shop-items";
import type { I18nLocale } from "@/src/i18n";
import { getT } from "@/src/i18n";

const CATEGORY_KEYS: Record<string, string> = {
  reaction_gifts: "shop.reactionGifts",
  elite_gifts: "shop.eliteGifts",
  status_boosts: "shop.statusBoosts",
};

type Props = {
  open: boolean;
  onClose: () => void;
  coins: number;
  onSuccess?: (newBalance: number) => void;
  onGetCoins?: () => void;
  locale?: I18nLocale;
};

export default function ShopModal({
  open,
  onClose,
  coins,
  onSuccess,
  onGetCoins,
  locale = "en",
}: Props) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState<string | null>(null);
  const t = getT(locale);
  const items = getShopItems();

  if (!open) return null;

  const grouped = items.reduce<Record<string, ShopItem[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  const handleBuy = async (item: ShopItem) => {
    if (coins < item.cost) {
      toast.error(t("shop.insufficientBalance"));
      return;
    }
    setLoading(item.id);
    try {
      const result = await buyItem(item.id);
      if (result.success) {
        toast.success(`${t("common.buy")} ${t(`shop.${item.nameKey}`)}!`);
        onSuccess?.(result.newBalance);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Purchase failed");
    } finally {
      setLoading(null);
    }
  };

  const userId = (session as { userId?: string })?.userId ?? (session?.user as { id?: string })?.id;
  if (!userId) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
        <div
          className="w-full max-w-lg rounded-2xl border border-violet-500/35 bg-gradient-to-b from-[#12121a] to-[#08080c] p-6 shadow-[0_0_60px_rgba(139,92,246,0.25)]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="shop-guest-title"
        >
          <h2
            id="shop-guest-title"
            className="text-center text-xl font-bold text-white"
            style={{ fontFamily: "var(--font-syne), system-ui" }}
          >
            {t("shop.guestPitchTitle")}
          </h2>
          <p className="mt-3 text-center text-sm leading-relaxed text-white/70">
            {t("shop.guestPitchLead")}
          </p>
          <ul className="mt-4 space-y-2 text-sm text-white/65">
            <li className="flex gap-2">
              <span className="text-emerald-400">✓</span>
              {t("shop.guestPitchBullet1")}
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-400">✓</span>
              {t("shop.guestPitchBullet2")}
            </li>
          </ul>
          {onGetCoins && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onGetCoins();
              }}
              className="mt-6 min-h-12 w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3.5 text-base font-bold text-white shadow-[0_0_28px_rgba(139,92,246,0.45)] transition hover:opacity-95 active:scale-[0.99]"
            >
              {t("shop.guestBuyCoinsCta")}
            </button>
          )}
          <p className="mt-5 text-center text-xs text-white/45">{t("shop.guestSignInHint")}</p>
          <button
            type="button"
            onClick={() =>
              signIn(undefined, {
                callbackUrl: typeof window !== "undefined" ? window.location.href : "/",
              })
            }
            className="mt-2 min-h-11 w-full rounded-xl border border-white/15 py-2.5 text-sm font-medium text-violet-200 transition hover:bg-white/5"
          >
            {t("shop.guestSignInCta")}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full py-2 text-sm text-white/50 underline-offset-2 hover:text-white/70"
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-violet-500/40 bg-gradient-to-b from-[#0d0d12] to-[#050508] p-6 shadow-[0_0_80px_rgba(139,92,246,0.25),inset_0_1px_0_rgba(255,255,255,0.05)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shop-modal-title"
      >
        <div
          className="shop-flash-sale-banner mb-5 rounded-xl border border-rose-500/50 bg-gradient-to-r from-rose-600/40 via-fuchsia-600/35 to-amber-500/30 px-4 py-2.5 text-center"
          role="status"
        >
          <span className="text-sm font-extrabold uppercase tracking-[0.25em] text-rose-100 drop-shadow-[0_0_12px_rgba(251,113,133,0.9)]">
            {t("shop.flashSale")}
          </span>
          <span className="mt-1 block text-xs font-medium text-white/80">{t("shop.flashSaleSub")}</span>
        </div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 id="shop-modal-title" className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-syne), system-ui" }}>
              {t("shop.title")}
            </h2>
            <p className="mt-1 text-sm text-violet-300/80">{t("shop.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-violet-500/20 px-3 py-1 text-sm font-semibold text-violet-300">
              {coins} {t("common.coins")}
            </span>
            {onGetCoins && (
              <button
                type="button"
                onClick={() => { onClose(); onGetCoins(); }}
                className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/30"
              >
                Add balance
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              aria-label={t("common.close")}
            >
              ×
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {Object.entries(grouped).map(([cat, catItems]) => (
            <section key={cat}>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-violet-400">
                {t(CATEGORY_KEYS[cat] ?? cat)}
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {catItems.map((item) => {
                  const canAfford = coins >= item.cost;
                  const isDisabled = loading !== null;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={isDisabled || !canAfford}
                      onClick={() => handleBuy(item)}
                      className="group flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-violet-500/50 hover:bg-violet-500/10 hover:shadow-[0_0_20px_rgba(139,92,246,0.2)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="text-3xl transition-transform group-hover:scale-110">{item.icon}</span>
                      <span className="text-sm font-medium text-white">{t(`shop.${item.nameKey}`)}</span>
                      <span className="text-xs text-violet-400">{item.cost} {t("common.coins")}</span>
                      {loading === item.id ? (
                        <span className="text-xs text-violet-400">{t("common.loading")}</span>
                      ) : (
                        <span className="rounded-lg bg-violet-600 px-3 py-1 text-xs font-semibold text-white">
                          {t("shop.buyWith1Click")}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
