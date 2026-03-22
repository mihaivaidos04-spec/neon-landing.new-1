"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getBrowserLocale, type ContentLocale } from "@/src/lib/content-i18n";

const LoginWall = dynamic(() => import("@/src/components/LoginWall"), { ssr: false });

/**
 * Dedicated /login route uses the same unified LoginWall as the landing “Sign in” flow.
 */
export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [locale, setLocale] = useState<ContentLocale>("en");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) setLocale(getBrowserLocale());
  }, [mounted]);

  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050508] text-white">
        <span className="animate-pulse text-white/60">…</span>
      </div>
    );
  }

  if (status === "authenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#050508]">
      <LoginWall open onClose={() => router.push("/")} locale={locale} />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[520] flex justify-center pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="pointer-events-auto text-sm text-white/45 underline-offset-2 transition-colors hover:text-fuchsia-200/90"
        >
          ← {locale === "ro" ? "Înapoi la NEON" : "Back to NEON"}
        </button>
      </div>
    </div>
  );
}
