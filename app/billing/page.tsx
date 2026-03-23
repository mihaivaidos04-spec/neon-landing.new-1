"use client";

import { useSession, signIn } from "next-auth/react";
import { useCallback, useEffect, useState, Suspense, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { BILLING_PACKS, type BillingPack } from "@/src/lib/billing-packs";
import PoweredByStripeBadge from "@/src/components/PoweredByStripeBadge";

function formatUsd(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function CoinStackIcon({ tier }: { tier: 1 | 2 | 3 }) {
  const layers = tier === 1 ? 3 : tier === 2 ? 5 : 7;
  return (
    <svg viewBox="0 0 40 44" className="mx-auto h-11 w-11 text-amber-300/90" aria-hidden>
      {Array.from({ length: layers }).map((_, i) => (
        <ellipse
          key={i}
          cx="20"
          cy={40 - i * 4.5}
          rx="14"
          ry="3.2"
          fill="currentColor"
          opacity={0.2 + i * 0.1}
        />
      ))}
    </svg>
  );
}

function packTier(pack: BillingPack): 1 | 2 | 3 {
  if (pack.id === "starter") return 1;
  if (pack.id === "popular") return 2;
  return 3;
}

function aiWhisperLineForPack(pack: BillingPack): string {
  if (pack.id === "starter") return "VIP Bronze: 60 min AI translation / day";
  if (pack.id === "popular") return "VIP Silver: 3 hours AI translation / day";
  return "VIP Gold: unlimited AI translation / day";
}

function BillingPageInner() {
  const { data: session, status } = useSession();
  const userId = (session as { userId?: string })?.userId ?? session?.user?.id;
  const searchParams = useSearchParams();
  const router = useRouter();
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingPack, setLoadingPack] = useState<string | null>(null);
  const successToastShownRef = useRef(false);

  const loadBalance = useCallback(async () => {
    if (!userId) {
      setBalance(null);
      return;
    }
    try {
      const res = await fetch("/api/wallet");
      const data = await res.json().catch(() => ({}));
      if (res.ok && typeof data.balance === "number") {
        setBalance(data.balance);
      } else {
        setBalance(0);
      }
    } catch {
      setBalance(0);
    }
  }, [userId]);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  useEffect(() => {
    const ok =
      searchParams.get("checkout") === "success" || searchParams.get("success") === "true";
    if (!ok) return;
    if (successToastShownRef.current) return;
    successToastShownRef.current = true;
    const paymentVibe = searchParams.get("payment") === "success";
    toast.success(
      paymentVibe
        ? "Coins added successfully! Enjoy the vibe."
        : "Payment successful! If you topped up coins, your wallet updates in a few seconds.",
      { duration: 5000, icon: paymentVibe ? "✨" : "✓" }
    );
    void loadBalance();
    router.replace("/billing", { scroll: false });
  }, [searchParams, router, loadBalance]);

  async function buyPack(amount: number, coinsAmount: number, packId: string) {
    if (!userId) {
      toast(
        "Ești la un pas de monede: conectează-te rapid (Google) — după plată, monedele intră instant în cont. Durează câteva secunde.",
        { icon: "✨", duration: 5000 }
      );
      void signIn(undefined, {
        callbackUrl: typeof window !== "undefined" ? `${window.location.origin}/billing` : "/billing",
      });
      return;
    }
    setLoadingPack(packId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, coinsAmount }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Checkout failed");
        return;
      }
      if (data.url) {
        window.location.href = data.url as string;
        return;
      }
      toast.error("No checkout URL");
    } catch (e) {
      console.error(e);
      toast.error("Network error");
    } finally {
      setLoadingPack(null);
    }
  }

  return (
    <div className="min-h-screen max-w-[100vw] overflow-x-clip bg-[#030306] text-white antialiased">
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 80% at 50% -20%, rgba(139, 92, 246, 0.15), transparent 55%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(57, 255, 20, 0.06), transparent 45%)",
        }}
      />

      <main className="relative z-10 mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-10 flex flex-col items-center justify-between gap-6 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-400/90">
              Neon Coins
            </p>
            <h1 className="mt-2 font-serif text-3xl font-light tracking-tight sm:text-4xl">
              Top up your balance
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/55">
              Alege un pachet — plătești în siguranță cu Stripe, iar monedele apar imediat în cont. Cadouri
              premium, filtre și boost-uri se deblochează din prima secundă după plată.
            </p>
          </div>

          <div className="flex w-full flex-col items-center sm:w-auto sm:items-end">
            <p className="text-[11px] font-medium uppercase tracking-wider text-white/45">
              Your balance
            </p>
            <div
              className="mt-2 rounded-2xl border border-violet-500/40 bg-violet-950/50 px-8 py-4 text-center shadow-[0_0_40px_rgba(139,92,246,0.45),0_0_80px_rgba(57,255,20,0.12)] sm:min-w-[200px]"
              style={{
                boxShadow:
                  "0 0 32px rgba(139, 92, 246, 0.5), 0 0 64px rgba(57, 255, 20, 0.15), inset 0 1px 0 rgba(255,255,255,0.08)",
              }}
            >
              <span className="font-mono text-3xl font-bold tabular-nums text-white sm:text-4xl">
                {status === "loading" || balance === null ? "—" : balance.toLocaleString()}
              </span>
              <span className="ml-2 text-sm font-medium text-violet-200/90">coins</span>
            </div>
            {status === "unauthenticated" && (
              <p className="mt-4 max-w-[16rem] text-center text-xs leading-relaxed text-white/50 sm:text-right">
                După primul pachet vezi soldul aici live. Apasă{" "}
                <strong className="text-violet-300/90">Buy Now</strong> la pachet — te ghidăm să te conectezi
                doar ca să-ți credităm monedele în contul Neon.
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {BILLING_PACKS.map((pack) => (
            <div
              key={pack.id}
              id={pack.id === "whale" ? "billing-pack-whale" : undefined}
              className={`relative flex flex-col rounded-2xl border p-6 transition-all ${
                pack.popular
                  ? "border-fuchsia-500/55 bg-gradient-to-b from-fuchsia-950/35 via-violet-950/80 to-zinc-950/95 shadow-[0_0_48px_rgba(236,72,153,0.22)]"
                  : "border-fuchsia-500/20 border-white/10 bg-zinc-950/80 bg-gradient-to-b from-white/[0.04] to-transparent"
              }`}
            >
              {pack.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500 px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-fuchsia-500/50">
                  Best Value
                </span>
              )}
              <div className="mb-2">
                <CoinStackIcon tier={packTier(pack)} />
              </div>
              <h2 className="text-lg font-semibold text-white">{pack.label}</h2>
              <p className="mt-1 text-3xl font-light text-white">{formatUsd(pack.priceUsd)}</p>
              <p className="mt-2 text-sm text-violet-200/90">
                {pack.bonusCoins > 0 ? (
                  <>
                    <span className="font-semibold">{pack.baseCoins.toLocaleString()}</span>
                    <span className="text-white/50"> + </span>
                    <span className="font-semibold text-fuchsia-300">{pack.bonusCoins} bonus</span>
                    <span className="block text-xs text-white/45">
                      = {pack.coins.toLocaleString()} coins total
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold">{pack.coins.toLocaleString()}</span> coins
                  </>
                )}
              </p>
              <ul className="mt-4 flex-1 space-y-2 text-xs text-white/55">
                <li className="flex gap-2">
                  <span className="text-fuchsia-400">🤖</span>
                  <span className="text-violet-200/90">{aiWhisperLineForPack(pack)}</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400">✓</span> Instant delivery
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400">✓</span> Use for gifts &amp; features
                </li>
              </ul>
              <button
                type="button"
                disabled={loadingPack !== null || status === "loading"}
                onClick={() => buyPack(pack.priceUsd, pack.coins, pack.id)}
                className="mt-6 min-h-[48px] w-full rounded-xl border border-fuchsia-500/30 bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(192,38,211,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loadingPack === pack.id ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <span
                      className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-fuchsia-400/40 border-t-pink-300"
                      aria-hidden
                    />
                    Redirecting…
                  </span>
                ) : (
                  "Buy"
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-violet-500/25 bg-violet-950/25 px-5 py-4 text-center">
          <p className="text-sm font-semibold text-violet-200/95">Subscription plans &amp; passes</p>
          <p className="mt-1 text-xs leading-relaxed text-white/50">Cancel anytime — no long-term commitment.</p>
        </div>

        <p className="mt-12 text-center text-[11px] text-white/35">
          Payments processed by Stripe. By purchasing you agree to our{" "}
          <Link href="/terms" className="text-violet-400 underline hover:text-violet-300">
            Terms
          </Link>
          ,{" "}
          <Link href="/privacy" className="text-violet-400 underline hover:text-violet-300">
            Privacy
          </Link>
          , and{" "}
          <Link href="/refunds" className="text-violet-400 underline hover:text-violet-300">
            Refunds
          </Link>
          .
        </p>

        <p className="mx-auto mt-4 max-w-lg text-center text-[10px] leading-relaxed text-white/30">
          30-day refund policy — see our Refunds page for eligibility and how to request a refund.
        </p>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center text-sm text-white/40 underline hover:text-white/70"
          >
            ← Back to app
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#030306] text-white/60">
          Loading…
        </div>
      }
    >
      <BillingPageInner />
    </Suspense>
  );
}
