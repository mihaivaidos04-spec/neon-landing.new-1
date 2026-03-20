"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { I18nLocale } from "@/src/i18n";
import { getT, getLocaleFromBrowser, isRtl } from "@/src/i18n";
import UserNameWithFlag from "@/src/components/UserNameWithFlag";

type ActivityData = Record<string, number>;
type Supporter = {
  userId: string;
  totalSent: number;
  name: string | null;
  image: string | null;
  countryCode?: string | null;
};

const HEATMAP_COLORS = [
  "bg-white/5",
  "bg-violet-500/20",
  "bg-violet-500/40",
  "bg-violet-500/60",
  "bg-violet-500/80",
  "bg-violet-500",
];

function getColorForValue(val: number, max: number): string {
  if (val <= 0) return HEATMAP_COLORS[0];
  const idx = Math.min(
    Math.ceil((val / Math.max(max, 1)) * (HEATMAP_COLORS.length - 1)),
    HEATMAP_COLORS.length - 1
  );
  return HEATMAP_COLORS[idx];
}

export default function ProfilePage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const [activity, setActivity] = useState<ActivityData>({});
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [locale, setLocale] = useState<I18nLocale>("en");

  useEffect(() => {
    setLocale(getLocaleFromBrowser());
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/me/sync-country", { method: "POST" })
      .then((r) => r.json())
      .then((d: { updated?: boolean }) => {
        if (d.updated) void updateSession?.();
      })
      .catch(() => {});
  }, [status, updateSession]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status !== "authenticated") return;

    Promise.all([
      fetch("/api/profile/activity?days=365").then((r) => r.json()),
      fetch("/api/profile/supporters").then((r) => r.json()),
    ]).then(([actRes, supRes]) => {
      if (actRes.activity) setActivity(actRes.activity);
      if (supRes.supporters) setSupporters(supRes.supporters);
    });
  }, [status, router]);

  const t = getT(locale);
  const rtl = isRtl(locale);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050508] text-white">
        <span className="animate-pulse">{t("common.loading")}</span>
      </div>
    );
  }

  const xp = (session as { xp?: number })?.xp ?? 0;
  const currentLevel = (session as { currentLevel?: number })?.currentLevel ?? 1;

  const dates: string[] = [];
  for (let i = 364; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }

  const maxVal = Math.max(...Object.values(activity), 1);
  const weeks = 53;
  const grid: { date: string; val: number }[] = dates.map((d) => ({
    date: d,
    val: activity[d] ?? 0,
  }));

  return (
    <div
      className="min-h-screen bg-[#050508] text-[#faf5eb]"
      dir={rtl ? "rtl" : "ltr"}
    >
      <div className="mx-auto max-w-3xl px-4 py-12">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mb-6 text-sm text-violet-400 hover:text-violet-300"
        >
          ← Back
        </button>

        <h1 className="mb-8 text-2xl font-bold" style={{ fontFamily: "var(--font-syne), system-ui" }}>
          {t("profile.title")}
        </h1>

        <div className="mb-10 flex items-center gap-4 rounded-xl border border-violet-500/20 bg-violet-950/20 p-6">
          {session?.user?.image && (
            <Image
              src={session.user.image}
              alt=""
              width={64}
              height={64}
              className="rounded-full"
            />
          )}
          <div className="min-w-0 flex-1">
            <UserNameWithFlag
              name={session?.user?.name ?? session?.user?.email ?? "User"}
              countryCode={session?.countryCode ?? null}
              locale={locale}
              nameClassName="text-lg font-semibold"
            />
            <p className="text-sm text-violet-400">
              {t("profile.level")} {currentLevel} · {xp} {t("profile.xp")}
            </p>
          </div>
        </div>

        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold text-violet-300">{t("profile.activityHeatmap")}</h2>
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5 p-4">
            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${weeks}, minmax(8px, 1fr))`,
                width: "fit-content",
              }}
            >
              {grid.map((cell) => (
                <div
                  key={cell.date}
                  className={`h-3 w-3 min-w-[12px] rounded-sm transition-colors ${getColorForValue(cell.val, maxVal)}`}
                  title={`${cell.date}: ${cell.val} XP`}
                />
              ))}
            </div>
            <div className="mt-2 flex gap-4 text-xs text-white/50">
              <span>Less</span>
              {HEATMAP_COLORS.map((c, i) => (
                <div key={i} className={`h-3 w-3 rounded-sm ${c}`} />
              ))}
              <span>More</span>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-violet-300">{t("profile.topSupporters")}</h2>
          {supporters.length === 0 ? (
            <p className="text-white/50">{t("profile.noSupporters")}</p>
          ) : (
            <div className="space-y-3">
              {supporters.map((s, i) => (
                <div
                  key={s.userId}
                  className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <span className="text-lg font-bold text-violet-400">#{i + 1}</span>
                  {s.image ? (
                    <Image src={s.image} alt="" width={40} height={40} className="rounded-full" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-violet-500/30" />
                  )}
                  <span className="min-w-0 flex-1 font-medium">
                    <UserNameWithFlag
                      name={s.name ?? "Anonymous"}
                      countryCode={s.countryCode ?? null}
                      locale={locale}
                      nameClassName="font-medium"
                    />
                  </span>
                  <span className="text-violet-400">{s.totalSent} coins</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
