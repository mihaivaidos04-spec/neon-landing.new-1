"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import useSWR from "swr";
import { motion } from "framer-motion";
import type { ContentLocale } from "../lib/content-i18n";
import { getContentT } from "../lib/content-i18n";
import LazyUserFlag from "./LazyUserFlag";

type Supporter = {
  rank: number;
  userId: string;
  name: string;
  image: string | null;
  countryCode: string | null;
  totalCoinsSpent: number;
};

type ApiRes = { supporters: Supporter[] };

const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<ApiRes>);

function normalizeNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const digits = String(value ?? "").replace(/[^\d.-]/g, "");
  const parsed = Number.parseFloat(digits);
  return Number.isFinite(parsed) ? parsed : 0;
}

type Props = {
  locale: ContentLocale;
  className?: string;
  /** Bump when local user sends a gift to hint refresh */
  refreshKey?: number;
  /** Narrow theater toolbox (left rail) vs wide sidebar next to video */
  variant?: "sidebar" | "toolbox";
};

export default function TopSupportersSidebar({
  locale,
  className = "",
  refreshKey = 0,
  variant = "sidebar",
}: Props) {
  const t = getContentT(locale);

  const { data, mutate } = useSWR<ApiRes>("/api/leaderboard/top-supporters", fetcher, {
    refreshInterval: 15_000,
    revalidateOnFocus: true,
  });

  useEffect(() => {
    if (refreshKey > 0) void mutate();
  }, [refreshKey, mutate]);

  const supporters = data?.supporters ?? [];
  const isToolbox = variant === "toolbox";

  return (
    <aside
      className={`top-supporters-sidebar flex w-full flex-col rounded-2xl border border-fuchsia-500/25 bg-black/50 shadow-[0_0_24px_rgba(192,38,211,0.12)] backdrop-blur-md ${
        isToolbox
          ? "max-h-[11rem] p-2 xl:max-h-[13rem]"
          : "p-3 xl:w-[12.5rem] xl:shrink-0"
      } ${className}`}
      aria-label="Top supporters"
    >
      <div className={`border-b border-white/10 ${isToolbox ? "pb-1.5" : "pb-2"}`}>
        <h3
          className={`text-center font-bold uppercase tracking-[0.2em] text-fuchsia-200/90 ${
            isToolbox ? "text-[8px] leading-tight" : "text-[10px]"
          }`}
        >
          {locale === "ro" ? "Top susținători" : "Top Supporters"}
        </h3>
        <Link
          href="/trending"
          className={`mt-1 block text-center font-semibold text-orange-300/90 underline-offset-2 hover:text-orange-200 hover:underline ${
            isToolbox ? "text-[8px]" : "text-[10px]"
          }`}
        >
          {t.trendingSidebarLink}
        </Link>
      </div>

      {supporters.length === 0 ? (
        <p
          className={`py-3 text-center leading-relaxed text-white/50 ${isToolbox ? "text-[9px] px-0.5" : "py-6 text-xs"}`}
        >
          {locale === "ro" ? "Fii primul care susține!" : "Be the first to support!"}
        </p>
      ) : (
        <ul
          className={`flex flex-col overflow-y-auto overscroll-contain ${isToolbox ? "mt-1.5 max-h-[8.5rem] gap-1" : "mt-2 gap-1.5"}`}
        >
          {supporters.map((s) => {
            const safeRank = normalizeNumber(s.rank);
            const safeTotalSpent = normalizeNumber(s.totalCoinsSpent);
            return (
            <motion.li
              key={s.userId}
              layout
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              title={s.name}
              className={`top-supporter-row flex items-center rounded-lg border border-white/5 bg-white/[0.03] ${
                isToolbox ? "gap-1 px-1 py-1" : "gap-2 px-2 py-1.5"
              }`}
            >
              <span
                className={`number-plain shrink-0 text-center font-bold tabular-nums text-fuchsia-300/90 ${
                  isToolbox ? "w-3 text-[9px]" : "w-4 text-[11px]"
                }`}
              >
                {safeRank.toLocaleString("en-US")}
              </span>
              {!isToolbox && (
                <LazyUserFlag code={s.countryCode} locale={locale} size="sm" className="shrink-0" />
              )}
              <div
                className={`relative shrink-0 overflow-hidden rounded-full border border-fuchsia-500/30 bg-zinc-800 ${
                  isToolbox ? "h-5 w-5" : "h-7 w-7"
                }`}
              >
                {s.image ? (
                  <Image
                    src={s.image}
                    alt=""
                    width={isToolbox ? 20 : 28}
                    height={isToolbox ? 20 : 28}
                    className="h-full w-full object-cover"
                    unoptimized={s.image.startsWith("http")}
                  />
                ) : (
                  <div
                    className={`flex h-full w-full items-center justify-center text-white/40 ${isToolbox ? "text-[8px]" : "text-[10px]"}`}
                  >
                    ?
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate font-semibold text-white/90 ${isToolbox ? "text-[9px] leading-tight" : "text-[11px]"}`}
                >
                  {s.name}
                </p>
                <p className={`gift-price-text number-plain text-violet-300/80 ${isToolbox ? "text-[8px] leading-tight" : "text-[10px]"}`}>
                  {safeTotalSpent.toLocaleString("en-US")} {t.coinsLabel}
                </p>
              </div>
            </motion.li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
