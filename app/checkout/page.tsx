"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { STRIPE_PLANS } from "@/src/lib/stripe-products";
import { formatLocalPriceApprox } from "@/src/lib/lemon-products";

const MicroAd = dynamic(() => import("@/src/components/MicroAd"), { ssr: false });

function formatUsd(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoValid, setPromoValid] = useState<{ id: string; bonusPercent: number } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const userId = (session as { userId?: string })?.userId ?? session?.user?.id;

  useEffect(() => {
    if (searchParams.get("canceled") === "1") {
      toast("Checkout canceled. You can continue when you're ready.");
    }
  }, [searchParams]);

  async function validatePromo() {
    const code = promoCode.trim().toUpperCase();
    if (!code || code.length < 4) {
      setPromoValid(null);
      return;
    }
    setPromoLoading(true);
    try {
      const res = await fetch(`/api/promocode/validate?code=${encodeURIComponent(code)}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.valid) {
        setPromoValid({ id: data.promocodeId, bonusPercent: data.bonusPercent });
        toast.success(`${data.bonusPercent}% bonus on your first qualifying purchase`);
      } else {
        setPromoValid(null);
        toast.error(data.error ?? "Invalid code");
      }
    } catch {
      setPromoValid(null);
      toast.error("Could not validate code");
    } finally {
      setPromoLoading(false);
    }
  }

  async function startCheckout(planId: string) {
    if (!userId) {
      toast.error("Please sign in to continue");
      return;
    }
    setLoadingId(planId);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          promocodeId: promoValid?.id,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Checkout could not be started");
        return;
      }
      if (data.url) {
        window.location.href = data.url as string;
        return;
      }
      toast.error("No checkout URL returned");
    } catch (e) {
      console.error(e);
      toast.error("Network error");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="min-h-screen max-w-[100vw] overflow-x-clip bg-[#030306] text-white antialiased">
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 80% at 50% -30%, rgba(139, 92, 246, 0.18), transparent 50%), radial-gradient(ellipse 80% 50% at 100% 100%, rgba(57, 255, 20, 0.06), transparent 45%)",
        }}
      />
      <main className="relative z-10 mx-auto flex max-w-5xl flex-col px-4 py-14 sm:px-6 sm:py-20">
        <header className="mb-2 text-center sm:mb-4 sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-400/90">
            NeonLive Pro
          </p>
          <h1 className="mt-3 font-serif text-3xl font-light tracking-tight text-white sm:text-4xl md:text-5xl">
            Platform <span className="text-violet-300">credits</span> &amp; tools
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/60 sm:mx-0">
            Secure checkout powered by Stripe. Credits unlock creator features, session enhancements,
            and platform utilities. One-time purchases — no hidden fees.
          </p>
        </header>

        {status === "unauthenticated" && (
          <div className="mb-10 rounded-2xl border border-violet-500/30 bg-violet-950/40 px-6 py-5 text-center sm:text-left">
            <p className="text-sm text-white/90">Sign in to complete your purchase.</p>
            <button
              type="button"
              onClick={() => signIn()}
              className="mt-4 min-h-12 w-full rounded-xl bg-white px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-violet-100 sm:w-auto"
            >
              Continue with Google
            </button>
          </div>
        )}

        <section className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {STRIPE_PLANS.map((p) => (
                <div
                  key={p.id}
                  className={`relative flex flex-col rounded-2xl border p-6 transition-all ${
                    p.recommended
                      ? "border-violet-400/50 bg-gradient-to-b from-violet-950/80 to-zinc-950/90 shadow-[0_0_40px_rgba(139,92,246,0.15)]"
                      : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  {p.recommended && (
                    <span className="absolute -top-3 left-6 rounded-full bg-violet-500 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      Recommended
                    </span>
                  )}
                  <h3 className="text-lg font-semibold text-white">{p.name}</h3>
                  <p className="mt-1 text-xs text-white/50">{p.tagline}</p>
                  <p className="mt-4 font-serif text-3xl font-light text-white">{formatUsd(p.amountCents)}</p>
                  <p className="mt-1 text-[11px] text-white/40">
                    {formatLocalPriceApprox(p.amountCents / 100, "IDR")}
                  </p>
                  {p.credits > 0 && (
                    <p className="mt-3 text-sm font-medium text-violet-200/90">
                      {p.credits.toLocaleString()} platform credits
                    </p>
                  )}
                  {p.enableGhostMode && (
                    <p className="mt-3 text-sm font-medium text-emerald-300/90">Privacy listing upgrade</p>
                  )}
                  <ul className="mt-4 flex-1 space-y-2 text-xs text-white/65">
                    {p.highlights.map((h) => (
                      <li key={h} className="flex gap-2">
                        <span className="text-violet-400">✓</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => startCheckout(p.id)}
                    disabled={loadingId !== null || status !== "authenticated"}
                    className="mt-6 min-h-[52px] w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {loadingId === p.id ? "Redirecting…" : "Continue to secure checkout"}
                  </button>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <label className="text-xs font-semibold uppercase tracking-wider text-white/50">
                Creator promo code
              </label>
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  placeholder="Optional"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value.toUpperCase());
                    setPromoValid(null);
                  }}
                  onBlur={validatePromo}
                  className="flex-1 rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-sm text-white placeholder:text-white/30"
                />
                <button
                  type="button"
                  onClick={validatePromo}
                  disabled={promoLoading}
                  className="rounded-xl border border-violet-500/40 bg-violet-600/30 px-4 py-2 text-sm font-medium text-violet-100 disabled:opacity-50"
                >
                  {promoLoading ? "…" : "Apply"}
                </button>
              </div>
              {promoValid && (
                <p className="mt-2 text-xs text-emerald-400/90">
                  {promoValid.bonusPercent}% bonus on first qualifying credit purchase
                </p>
              )}
            </div>

            <p className="text-center text-[11px] text-white/35 sm:text-left">
              Payments processed by Stripe. Apple Pay, Google Pay, and major cards where available. By
              purchasing you agree to our{" "}
              <Link href="/terms" className="text-violet-400 underline hover:text-violet-300">
                Terms
              </Link>
              ,{" "}
              <Link href="/privacy" className="text-violet-400 underline hover:text-violet-300">
                Privacy Policy
              </Link>
              , and{" "}
              <Link href="/refunds" className="text-violet-400 underline hover:text-violet-300">
                Refund Policy
              </Link>
              .
            </p>
          </div>

          <aside className="space-y-6">
            <div className="flex justify-center lg:justify-start">
              <MicroAd format="rectangle" />
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-xs leading-relaxed text-white/55">
              <p className="font-semibold text-white/80">Why credits?</p>
              <p className="mt-2">
                Credits are used inside NeonLive for creator tools and session features. They are not
                transferable off-platform and do not constitute gambling or prizes of monetary value
                outside the service.
              </p>
            </div>
          </aside>
        </section>

        <div className="mt-16 text-center">
          <Link href="/" className="text-sm text-white/40 underline hover:text-white/70">
            ← Return to app
          </Link>
        </div>
      </main>
    </div>
  );
}
