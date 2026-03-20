"use client";

import { useState, useEffect } from "react";

function getGreeting(): { text: string; subtext: string; gradient: string } {
  const h = new Date().getHours();
  if (h >= 5 && h < 10) {
    return {
      text: "Good morning",
      subtext: "The neon awaits.",
      gradient: "from-amber-500/20 via-violet-500/10 to-transparent",
    };
  }
  if (h >= 10 && h < 17) {
    return {
      text: "Ready when you are",
      subtext: "Connect. Gift. Shine.",
      gradient: "from-violet-500/15 via-emerald-500/10 to-transparent",
    };
  }
  if (h >= 17 && h < 22) {
    return {
      text: "Good evening",
      subtext: "The best connections happen under neon.",
      gradient: "from-violet-600/25 via-fuchsia-500/10 to-transparent",
    };
  }
  return {
    text: "Still here",
    subtext: "The night is young.",
    gradient: "from-indigo-900/30 via-violet-600/15 to-transparent",
  };
}

export default function TimeOfDayGreeting() {
  const [visible, setVisible] = useState(false);
  const [greeting, setGreeting] = useState(getGreeting);

  useEffect(() => {
    setGreeting(getGreeting());
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(t);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className={`fixed left-1/2 top-24 z-50 -translate-x-1/2 rounded-2xl border border-white/10 bg-black/60 px-6 py-4 backdrop-blur-xl transition-all duration-700 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
      style={{
        boxShadow: "0 0 40px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      <p
        className="text-center font-medium text-white"
        style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
      >
        {greeting.text}
      </p>
      <p className="mt-0.5 text-center text-sm text-white/60">{greeting.subtext}</p>
    </div>
  );
}
