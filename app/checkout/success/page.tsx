"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const hasShownToast = useRef(false);

  const sessionId = searchParams.get("session_id");
  const userId = (session as any)?.userId ?? session?.user?.id;

  useEffect(() => {
    if (!hasShownToast.current && (sessionId || status === "authenticated")) {
      hasShownToast.current = true;
      toast.success("Payment Successful");
    }
  }, [sessionId, status]);

  useEffect(() => {
    if (userId) {
      fetch("/api/wallet")
        .then((r) => r.json())
        .catch(() => {});
    }
  }, [userId]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white antialiased">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="confetti-piece" />
        <div className="confetti-piece confetti-delay-1" />
        <div className="confetti-piece confetti-delay-2" />
        <div className="confetti-piece confetti-delay-3" />
      </div>

      <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
        <div className="inline-flex items-center justify-center rounded-full border border-emerald-400/60 bg-emerald-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200 shadow-[0_0_24px_rgba(74,222,128,0.7)]">
          Payment Success
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
          Contul tău a fost creditat cu{" "}
          <span className="text-emerald-300">noii Bănuți</span>
        </h1>
        <p className="mt-3 max-w-xl text-sm text-white/70">
          Plata a fost confirmată. Balanța ta a fost actualizată, iar toate
          beneficiile premium sunt active. Ecranul următor te așteaptă deja.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-emerald-400 px-8 text-sm font-semibold text-black shadow-[0_0_30px_rgba(74,222,128,0.9)] transition-transform hover:scale-[1.02]"
          >
            Înapoi în NEON
          </Link>
          <p className="text-[11px] text-white/40">
            Dacă nu vezi Bănuții actualizați în cont, reîncarcă pagina sau
            contactează suportul NEON.
          </p>
        </div>
      </main>
    </div>
  );
}
