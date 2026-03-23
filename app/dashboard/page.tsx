"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getT, getLocaleFromBrowser, type I18nLocale } from "@/src/i18n";
import { withConfetti } from "@/src/lib/safe-confetti";

function firePaymentSuccessConfetti() {
  const gold = ["#fbbf24", "#fcd34d", "#f59e0b", "#a855f7", "#22d3ee"];
  withConfetti((c) => {
    void c({
      particleCount: 100,
      spread: 88,
      origin: { y: 0.45 },
      colors: gold,
      ticks: 220,
      scalar: 1.05,
    });
    void c({
      particleCount: 40,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors: gold,
    });
    void c({
      particleCount: 40,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors: gold,
    });
  });
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { status, update: updateSession } = useSession();
  const paymentSuccess = searchParams.get("payment") === "success";
  const [mounted, setMounted] = useState(false);
  const [locale, setLocale] = useState<I18nLocale>("en");
  const [celebrationDone, setCelebrationDone] = useState(false);

  const t = useMemo(() => getT(locale), [locale]);

  useEffect(() => {
    setMounted(true);
    setLocale(getLocaleFromBrowser());
  }, []);

  useEffect(() => {
    if (!mounted || !paymentSuccess || celebrationDone) return;
    setCelebrationDone(true);
    void updateSession?.();
    firePaymentSuccessConfetti();
  }, [mounted, paymentSuccess, celebrationDone, updateSession]);

  const continueHome = () => {
    void updateSession?.();
    router.replace("/");
  };

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <span className="animate-pulse">{t("common.loading")}</span>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#030306] text-white antialiased">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(251,191,36,0.18), transparent 55%), radial-gradient(ellipse 70% 45% at 80% 60%, rgba(168,85,247,0.12), transparent 50%), radial-gradient(ellipse 60% 40% at 20% 70%, rgba(34,211,238,0.08), transparent 45%)",
          }}
        />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,transparent_35%)]" />

        <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-16">
          <div
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-black/55 p-8 shadow-[0_0_0_1px_rgba(251,191,36,0.12),0_24px_80px_rgba(0,0,0,0.65),0_0_60px_rgba(251,191,36,0.15)] backdrop-blur-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-success-title"
          >
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-400/20 blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-violet-600/20 blur-3xl"
              aria-hidden
            />

            <div className="relative mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-500/30 via-amber-400/10 to-violet-600/20 shadow-[0_0_32px_rgba(251,191,36,0.35)]">
                <span className="text-3xl" aria-hidden>
                  ✓
                </span>
              </div>
            </div>

            <h1
              id="payment-success-title"
              className="relative text-center text-2xl font-semibold tracking-tight text-white sm:text-[1.65rem]"
              style={{ fontFamily: "var(--font-syne), system-ui, sans-serif" }}
            >
              {t("dashboard.paymentTitle")}
            </h1>
            <p className="relative mt-3 text-center text-base font-medium text-amber-100/95">
              {t("dashboard.paymentSubtitle")}
            </p>
            <p className="relative mt-3 text-center text-sm leading-relaxed text-white/55">
              {t("dashboard.paymentDetail")}
            </p>

            <button
              type="button"
              onClick={continueHome}
              className="relative mt-8 flex min-h-[48px] w-full items-center justify-center rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 px-6 text-sm font-bold uppercase tracking-[0.12em] text-black shadow-[0_0_28px_rgba(251,191,36,0.45)] transition hover:brightness-105 active:scale-[0.99]"
            >
              {t("dashboard.paymentCta")}
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.replace("/");
    return null;
  }

  router.replace("/");
  return null;
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black text-white">
          <span className="animate-pulse">…</span>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
