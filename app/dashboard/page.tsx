"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const paymentSuccess = searchParams.get("payment") === "success";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !paymentSuccess) return;
    const t = setTimeout(() => {
      router.replace("/");
    }, 3500);
    return () => clearTimeout(t);
  }, [mounted, paymentSuccess, router]);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <span className="animate-pulse">Se încarcă...</span>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-black text-white antialiased">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(circle at 50% 30%, rgba(74, 222, 128, 0.2), transparent 50%), radial-gradient(circle at 50% 70%, rgba(139, 92, 246, 0.15), transparent 50%)",
          }}
        />
        <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
          <div className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-400/60 bg-emerald-500/10 px-4 py-2 text-sm font-semibold uppercase tracking-wider text-emerald-200 shadow-[0_0_24px_rgba(74,222,128,0.5)]">
            <span className="text-xl">🔋</span>
            Baterie 100%
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
            Plată reușită
          </h1>
          <p className="mt-3 max-w-xl text-sm text-white/70">
            Contul tău a fost creditat cu Bănuții. Bateria este la 100%. Te
            redirecționăm în NEON...
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-emerald-400 px-8 text-sm font-semibold text-black shadow-[0_0_30px_rgba(74,222,128,0.6)] transition-transform hover:scale-[1.02]"
            >
              Mergi la NEON
            </Link>
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
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <span className="animate-pulse">Se încarcă...</span>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
