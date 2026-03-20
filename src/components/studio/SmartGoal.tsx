"use client";

import { useState, useEffect } from "react";
import { getT } from "@/src/i18n";
import { useStudioLocale } from "@/src/components/studio/StudioLocaleContext";

type Props = { userId: string; locale?: "en" | "ar" | "id" };

type GoalData = { id: string; title: string; targetCoins: number; currentCoins: number } | null;

export default function SmartGoal({ userId, locale: localeProp }: Props) {
  const localeFromContext = useStudioLocale();
  const locale = localeProp ?? localeFromContext;
  const t = getT(locale);
  const [goal, setGoal] = useState<GoalData>(null);
  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState("");
  const [targetCoins, setTargetCoins] = useState(5000);
  const [loading, setLoading] = useState(false);

  const fetchGoal = () => {
    fetch("/api/studio/goal")
      .then((r) => r.json())
      .then((d) => {
        setGoal(d.goal);
        if (d.goal) {
          setTitle(d.goal.title);
          setTargetCoins(d.goal.targetCoins);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchGoal();
    const id = setInterval(fetchGoal, 15000);
    return () => clearInterval(id);
  }, [userId]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/studio/goal", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, targetCoins }),
      });
      const data = await res.json();
      if (res.ok) {
        setGoal(data.goal);
        setEditMode(false);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!goal && !editMode) {
    return (
      <div className="rounded-xl border border-violet-500/30 bg-violet-950/20 p-6">
        <h2 className="mb-4 text-lg font-semibold text-violet-300">{t("studio.smartGoal")}</h2>
        <button
          type="button"
          onClick={() => setEditMode(true)}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white"
        >
          {t("studio.setGoal")}
        </button>
      </div>
    );
  }

  const current = goal?.currentCoins ?? 0;
  const target = goal?.targetCoins ?? targetCoins;
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;

  return (
    <div className="rounded-xl border border-violet-500/30 bg-violet-950/20 p-6">
      <h2 className="mb-4 text-lg font-semibold text-violet-300">{t("studio.smartGoal")}</h2>
      {editMode ? (
        <div className="space-y-4">
          <input
            type="text"
            placeholder={t("studio.goalTitle")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white placeholder:text-white/40"
          />
          <input
            type="number"
            placeholder={t("studio.targetCoins")}
            value={targetCoins}
            onChange={(e) => setTargetCoins(parseInt(e.target.value, 10) || 0)}
            className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white"
            >
              {loading ? t("common.loading") : t("studio.setGoal")}
            </button>
            <button
              type="button"
              onClick={() => setEditMode(false)}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/80"
            >
              {t("common.close")}
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="mb-2 text-white">{goal?.title ?? title}</p>
          <div className="h-4 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all duration-500"
              style={{
                width: `${pct}%`,
                boxShadow: "0 0 20px rgba(139, 92, 246, 0.5)",
              }}
            />
          </div>
          <p className="mt-2 text-sm text-white/70">
            {current} / {target} coins
          </p>
          <button
            type="button"
            onClick={() => setEditMode(true)}
            className="mt-2 text-sm text-violet-400 hover:text-violet-300"
          >
            {t("studio.editGoal")}
          </button>
        </>
      )}
    </div>
  );
}
