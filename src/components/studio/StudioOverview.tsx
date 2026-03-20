"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { CreatorAnalytics } from "@/src/lib/creator-analytics";
import { getT } from "@/src/i18n";
import { useStudioLocale } from "@/src/components/studio/StudioLocaleContext";

const GIFT_COLORS = ["#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#6366f1"];
const GIFT_LABELS: Record<string, string> = {
  heart: "Heart",
  fire: "Fire",
  rocket: "Rocket",
  rose: "Rose",
  diamond: "Diamond",
  other: "Other",
};

type Props = { analytics: CreatorAnalytics; locale?: "en" | "ar" | "id" };

export default function StudioOverview({ analytics, locale: localeProp }: Props) {
  const localeFromContext = useStudioLocale();
  const locale = localeProp ?? localeFromContext;
  const t = getT(locale);

  const pieData = Object.entries(analytics.giftDistribution).map(([name, value]) => ({
    name: t(`studio.${name}`) || GIFT_LABELS[name] || name,
    value,
  }));

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-white/60">{t("studio.grossRevenue")}</p>
          <p className="text-2xl font-bold text-violet-400">€{analytics.grossRevenue.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-white/60">{t("studio.netRevenue")}</p>
          <p className="text-2xl font-bold text-emerald-400">€{analytics.netRevenue.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-white/60">{t("studio.avgGiftValue")}</p>
          <p className="text-2xl font-bold text-white">{analytics.averageGiftValue.toFixed(1)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-white/60">{t("studio.retentionRate")}</p>
          <p className="text-2xl font-bold text-white">{analytics.retentionRate.toFixed(1)}%</p>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="mb-4 text-lg font-semibold text-white">{t("studio.revenueOverTime")}</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analytics.revenueOverTime}>
              <defs>
                <linearGradient id="gradNet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} />
              <YAxis stroke="#9ca3af" fontSize={10} tickFormatter={(v) => `€${v}`} />
              <Tooltip
                contentStyle={{ background: "#1f2937", border: "1px solid rgba(255,255,255,0.1)" }}
                formatter={(value: unknown) => [`€${Number(value ?? 0).toFixed(2)}`, "Net"]}
              />
              <Area type="monotone" dataKey="net" stroke="#8b5cf6" fill="url(#gradNet)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="mb-4 text-lg font-semibold text-white">{t("studio.giftDistribution")}</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={GIFT_COLORS[i % GIFT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#1f2937", border: "1px solid rgba(255,255,255,0.1)" }}
                formatter={(value: unknown, name?: unknown) => {
                  const total = pieData.reduce((s, d) => s + d.value, 0);
                  const val = Number(value ?? 0);
                  const pct = total > 0 ? ((val / total) * 100).toFixed(1) : "0";
                  return [`${val} coins (${pct}%)`, String(name ?? "")];
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
