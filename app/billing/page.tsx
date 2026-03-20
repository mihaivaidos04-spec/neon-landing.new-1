"use client";

import { useSession, signIn } from "next-auth/react";
import { useCallback, useEffect, useState, Suspense, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { BILLING_PACKS } from "@/src/lib/billing-packs";

function formatUsd(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
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
    if (searchParams.get("checkout") !== "success") return;
    if (successToastShownRef.current) return;
    successToastShownRef.current = true;
    toast.success("Payment successful! Your coins have been added to your wallet.", {
      duration: 5000,
      icon: "✓",
    });
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
              className={`relative flex flex-col rounded-2xl border p-6 transition-all ${
                pack.popular
                  ? "border-violet-400/60 bg-gradient-to-b from-violet-950/90 to-zinc-950/90 shadow-[0_0_40px_rgba(139,92,246,0.2)]"
                  : "border-white/10 bg-white/[0.03]"
              }`}
            >
              {pack.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-500 px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-violet-500/40">
                  Most Popular
                </span>
              )}
              <h2 className="text-lg font-semibold text-white">{pack.label}</h2>
              <p className="mt-1 text-3xl font-light text-white">{formatUsd(pack.priceUsd)}</p>
              <p className="mt-2 text-sm text-violet-200/90">
                <span className="font-semibold">{pack.coins.toLocaleString()}</span> coins
              </p>
              <ul className="mt-4 flex-1 space-y-2 text-xs text-white/55">
                <li className="flex gap-2">
                  <span className="text-emerald-400">✓</span> Instant delivery to wallet
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400">✓</span> Use for gifts &amp; features
                </li>
              </ul>
              <button
                type="button"
                disabled={loadingPack !== null || status === "loading"}
                onClick={() => buyPack(pack.priceUsd, pack.coins, pack.id)}
                className="mt-6 min-h-[48px] w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loadingPack === pack.id ? "Redirecting…" : "Buy Now"}
              </button>
            </div>
          ))}
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
