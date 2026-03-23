"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import useSWR from "swr";
import { getBrowserLocale, getContentT } from "../../lib/content-i18n";
import LazyUserFlag from "../../components/LazyUserFlag";
import { motion } from "framer-motion";

type TrendingUser = {
  rank: number;
  userId: string;
  name: string;
  image: string | null;
  countryCode: string | null;
  coinsReceived: number;
};

type ApiRes = {
  updatedAt: string;
  windowHours: number;
  trending: TrendingUser[];
};

const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<ApiRes>);

function normalizeNumericText(input: string): string {
  return input
    .replace(/0️⃣/g, "0")
    .replace(/1️⃣/g, "1")
    .replace(/2️⃣/g, "2")
    .replace(/3️⃣/g, "3")
    .replace(/4️⃣/g, "4")
    .replace(/5️⃣/g, "5")
    .replace(/6️⃣/g, "6")
    .replace(/7️⃣/g, "7")
    .replace(/8️⃣/g, "8")
    .replace(/9️⃣/g, "9")
    .replace(/🔟/g, "10")
    .replace(/\uFE0F/g, "")
    .replace(/⃣/g, "");
}

export default function TrendingPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const locale = mounted ? getBrowserLocale() : "en";
  const t = getContentT(locale);
  const titleText = normalizeNumericText(t.trendingPageTitle);
  const subtitleText = normalizeNumericText(t.trendingPageSubtitle);
  const emptyText = normalizeNumericText(t.trendingPageEmpty);

  const { data, isLoading } = useSWR<ApiRes>("/api/trending/received-24h", fetcher, {
    refreshInterval: 30_000,
    revalidateOnFocus: true,
  });

  const list = data?.trending ?? [];
  const windowHours = Math.max(1, Math.trunc(data?.windowHours ?? 24));
  const windowHoursLabel = new Intl.NumberFormat("en-US").format(windowHours).replace(/[^\d,.-]/g, "");

  return (
    <div className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto w-full max-w-lg">
        <header className="mb-8 text-center">
          <Link
            href="/"
            className="mb-4 inline-block text-sm text-violet-300/90 underline-offset-4 hover:text-fuchsia-300 hover:underline"
          >
            ← {t.trendingPageBack}
          </Link>
          <h1 className="bg-gradient-to-r from-fuchsia-300 via-violet-200 to-cyan-200 bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-3xl">
            <span className="number-plain">{titleText}</span>
          </h1>
          <p className="number-plain mt-2 text-sm text-white/55">{subtitleText}</p>
        </header>

        {isLoading && list.length === 0 ? (
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-fuchsia-500/30 border-t-fuchsia-400" />
          </div>
        ) : list.length === 0 ? (
          <p className="number-plain rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm text-white/50">
            {emptyText}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {list.map((u) => {
              const isTop3 = u.rank <= 3;
              return (
                <motion.li
                  key={u.userId}
                  layout
                  transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  className={
                    isTop3
                      ? "trending-row--hot flex items-center gap-3 rounded-2xl border border-orange-400/45 bg-gradient-to-r from-orange-950/40 via-fuchsia-950/25 to-transparent px-3 py-2.5 shadow-[0_0_28px_rgba(251,146,60,0.18)]"
                      : "flex items-center gap-3 rounded-2xl border border-fuchsia-500/20 bg-black/40 px-3 py-2.5 shadow-[0_0_16px_rgba(192,38,211,0.08)]"
                  }
                >
                  <span
                    className={
                      isTop3
                        ? "number-plain w-7 shrink-0 text-center text-sm font-black tabular-nums text-orange-200"
                        : "number-plain w-7 shrink-0 text-center text-sm font-bold tabular-nums text-fuchsia-300/80"
                    }
                  >
                    {u.rank.toLocaleString("en-US")}
                  </span>
                  <LazyUserFlag code={u.countryCode} locale={locale} size="sm" className="shrink-0" />
                  <div
                    className={`relative h-10 w-10 shrink-0 overflow-hidden rounded-full ${
                      isTop3
                        ? "ring-2 ring-orange-400/70 ring-offset-2 ring-offset-black"
                        : "border border-fuchsia-500/35"
                    }`}
                  >
                    {u.image ? (
                      <Image
                        src={u.image}
                        alt=""
                        width={40}
                        height={40}
                        className="h-full w-full object-cover"
                        unoptimized={u.image.startsWith("http")}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-xs text-white/40">
                        ?
                      </div>
                    )}
                    {isTop3 && (
                      <span
                        className="trending-flame-badge absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-600 text-[11px] shadow-[0_0_12px_rgba(251,146,60,0.9)]"
                        title="Top 3"
                        aria-hidden
                      >
                        🔥
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white/95">{u.name}</p>
                    <p className="number-plain text-xs text-[var(--color-text-secondary)]">
                      {u.coinsReceived.toLocaleString()} {t.coinsLabel}{" "}
                      <span className="number-plain">· {windowHoursLabel}h</span>
                    </p>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}

        {data?.updatedAt ? (
          <p className="number-plain mt-6 text-center text-[10px] text-[var(--color-text-secondary)]">
            {new Date(data.updatedAt).toLocaleString("en-US")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
