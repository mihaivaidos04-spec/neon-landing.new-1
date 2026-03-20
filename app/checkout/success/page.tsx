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
  const userId = (session as { userId?: string })?.userId ?? session?.user?.id;

  useEffect(() => {
    if (!hasShownToast.current && (sessionId || status === "authenticated")) {
      hasShownToast.current = true;
      toast.success("Payment successful — thank you");
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
    <div className="relative min-h-screen overflow-hidden bg-[#030306] text-white antialiased">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 100% 80% at 50% -30%, rgba(139, 92, 246, 0.15), transparent 50%)",
        }}
      />

      <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
        <div className="inline-flex items-center justify-center rounded-full border border-emerald-400/50 bg-emerald-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
          Payment confirmed
        </div>
        <h1 className="mt-6 font-serif text-3xl font-light tracking-tight sm:text-4xl">
          Your <span className="text-violet-300">platform balance</span> is updating
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/65">
          Stripe has confirmed your purchase. Credits and any included features are applied automatically.
          If your balance doesn’t refresh immediately, reload the app.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3">
          <Link
            href="/"
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-white px-10 text-sm font-semibold text-zinc-900 shadow-[0_0_30px_rgba(255,255,255,0.12)] transition hover:bg-violet-100"
          >
            Back to NeonLive
          </Link>
          <p className="max-w-sm text-[11px] text-white/40">
            Questions? Contact support with your Stripe receipt email. See also our{" "}
            <Link href="/refunds" className="text-violet-400 underline hover:text-violet-300">
              refund policy
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
