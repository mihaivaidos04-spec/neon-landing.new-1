"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import { LEMON_PRODUCTS, formatPrice } from "@/src/lib/lemon-products";

const MicroAd = dynamic(() => import("@/src/components/MicroAd"), { ssr: false });

const NEON_GREEN = "#4ade80";

declare global {
  interface Window {
    LemonSqueezy?: { Url?: { Open: (url: string) => void } };
    createLemonSqueezy?: () => void;
  }
}

export default function CheckoutPage() {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.createLemonSqueezy) {
      window.createLemonSqueezy();
    }
  }, []);

  async function openLemonCheckout(variantId: string, productId: string) {
    if (!variantId) {
      toast.error("Variant ID not configured. Set NEXT_PUBLIC_LEMON_VARIANT_* in .env.local.");
      return;
    }
    setLoadingId(productId);
    try {
      const res = await fetch("/api/lemon/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Checkout failed");
        return;
      }
      const url = data.url;
      if (!url) {
        toast.error("No checkout URL returned");
        return;
      }
      if (typeof window !== "undefined" && window.LemonSqueezy?.Url?.Open) {
        window.LemonSqueezy.Url.Open(url);
      } else {
        window.open(url, "_blank");
      }
    } catch (e) {
      console.error("Checkout error", e);
      toast.error("Checkout request failed");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white antialiased">
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(circle at top, rgba(74, 222, 128, 0.16), transparent 55%), radial-gradient(circle at bottom, rgba(139, 92, 246, 0.24), transparent 55%)",
        }}
      />
      <main className="relative z-10 mx-auto flex max-w-5xl flex-col px-4 py-12 sm:px-6 sm:py-16 md:py-20">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Software Enhancements
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Unlock priority matching, extended battery & more. Digital rewards delivered instantly.
          </p>
        </header>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              {LEMON_PRODUCTS.map((p) => (
                <div
                  key={p.id}
                  className={`relative flex flex-col rounded-2xl border p-5 transition-all ${
                    p.isBestValue
                      ? "neon-border-animate border-emerald-400/80 bg-emerald-500/10"
                      : "border-white/10 bg-black/70"
                  }`}
                >
                  {p.badge && (
                    <span className="absolute -top-2.5 left-4 rounded-full bg-emerald-500 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-black shadow-lg">
                      {p.badge}
                    </span>
                  )}
                  <h3 className="text-lg font-semibold text-white">{p.name}</h3>
                  <p className="mt-1 text-sm font-semibold" style={{ color: NEON_GREEN }}>
                    {formatPrice(p.price)}
                  </p>
                  <p className="mt-2 text-xs text-white/60">
                    {p.rewards} Digital Reward{p.rewards > 1 ? "s" : ""}
                  </p>
                  <ul className="mt-3 flex-1 space-y-1 text-xs text-white/70">
                    {p.features.slice(0, -1).map((f, i) => (
                      <li key={i}>• {f}</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => openLemonCheckout(p.variantId, p.id)}
                    disabled={loadingId !== null}
                    className="mt-4 min-h-[48px] w-full rounded-full px-4 py-3 text-sm font-semibold text-black transition-all active:scale-[0.98] disabled:opacity-60"
                    style={{
                      background: p.isBestValue ? NEON_GREEN : "rgba(74, 222, 128, 0.9)",
                      boxShadow: p.isBestValue ? "0 0 20px rgba(74, 222, 128, 0.5)" : undefined,
                    }}
                  >
                    {loadingId === p.id ? "Se încarcă..." : "Unlock Now"}
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-white/40">
              Card, Apple Pay & Google Pay. Secure checkout via Lemon Squeezy.
            </p>
          </div>

          <aside className="space-y-6">
            <div className="flex justify-center">
              <MicroAd format="rectangle" />
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/70 p-4 text-xs text-white/60">
              <p>
                Prin achiziție, accepți{" "}
                <Link
                  href="/terms-and-conditions"
                  className="text-emerald-300 underline hover:text-emerald-200"
                >
                  Termenii și Condițiile
                </Link>{" "}
                și{" "}
                <Link
                  href="/privacy-policy"
                  className="text-emerald-300 underline hover:text-emerald-200"
                >
                  Politica de Confidențialitate
                </Link>
                .
              </p>
            </div>
          </aside>
        </section>

        <div className="mt-12 text-center text-xs text-white/40">
          <Link href="/" className="underline hover:text-white/70">
            ← Înapoi
          </Link>
        </div>
      </main>
    </div>
  );
}
