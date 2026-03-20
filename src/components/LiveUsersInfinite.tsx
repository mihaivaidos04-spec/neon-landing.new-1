"use client";

import { useCallback, useEffect, useRef } from "react";
import useSWRInfinite from "swr/infinite";
import UserNameWithFlag from "./UserNameWithFlag";
import { isPlausibleCountryCode } from "@/src/lib/valid-country-code";

function getKey(pageIndex: number) {
  return `/api/live-users?page=${pageIndex}`;
}

const fetcher = (url: string) =>
  fetch(url.startsWith("http") ? url : (typeof window !== "undefined" ? window.location.origin : "") + url).then(
    (r) => r.json()
  );

type User = { id: string; name: string; country: string; level: number };

const COUNTRY_NAMES: Record<string, string> = {
  SA: "Saudi Arabia",
  ID: "Indonesia",
  VN: "Vietnam",
  PH: "Philippines",
  MY: "Malaysia",
  EG: "Egypt",
  AE: "UAE",
  IN: "India",
  US: "USA",
  RO: "Romania",
  DE: "Germany",
  GB: "UK",
  XX: "Unknown",
};

export default function LiveUsersInfinite() {
  const { data, size, setSize, isLoading, isValidating } = useSWRInfinite(
    getKey,
    fetcher,
    { revalidateFirstPage: false }
  );

  const users = data?.flatMap((d) => d.users ?? []) ?? [];
  const hasMore = data?.[data.length - 1]?.hasMore ?? false;
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(() => {
    if (!isLoading && !isValidating && hasMore) {
      setSize((s) => s + 1);
    }
  }, [isLoading, isValidating, hasMore, setSize]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "100px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h3 className="mb-4 text-sm font-semibold text-white">Live now</h3>
      <div className="max-h-64 space-y-2 overflow-y-auto">
        {users.map((u: User) => (
          <div
            key={u.id}
            className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/5 px-3 py-2"
          >
            <UserNameWithFlag
              name={u.name}
              countryCode={
                u.country && u.country !== "XX" && isPlausibleCountryCode(u.country) ? u.country : null
              }
              nameClassName="text-sm text-white/90"
              className="min-w-0 flex-1"
            />
            <span className="shrink-0 text-xs text-white/50">
              {COUNTRY_NAMES[u.country] ?? u.country} · Lv{u.level}
            </span>
          </div>
        ))}
      </div>
      <div ref={loadMoreRef} className="h-4" />
      {(isLoading || isValidating) && (
        <div className="mt-2 flex justify-center">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-violet-400" />
        </div>
      )}
    </div>
  );
}
