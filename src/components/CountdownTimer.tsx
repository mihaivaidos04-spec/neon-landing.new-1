"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "neon_offer_end_ts";
const DEFAULT_DURATION_MS = 45 * 60 * 1000 + 12 * 1000; // 45m 12s

function getEndTimestamp(): number {
  if (typeof window === "undefined") return Date.now() + DEFAULT_DURATION_MS;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const ts = parseInt(stored, 10);
    if (ts > Date.now()) return ts;
  }
  const end = Date.now() + DEFAULT_DURATION_MS;
  localStorage.setItem(STORAGE_KEY, String(end));
  return end;
}

function format(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export default function CountdownTimer() {
  const [endTs, setEndTs] = useState<number | null>(null);
  const [h, setH] = useState(0);
  const [m, setM] = useState(45);
  const [s, setS] = useState(12);

  useEffect(() => {
    setEndTs(getEndTimestamp());
  }, []);

  useEffect(() => {
    if (endTs === null) return;
    const tick = () => {
      const now = Date.now();
      const left = Math.max(0, Math.floor((endTs - now) / 1000));
      if (left === 0) {
        setH(0);
        setM(0);
        setS(0);
        return;
      }
      setH(Math.floor(left / 3600));
      setM(Math.floor((left % 3600) / 60));
      setS(left % 60);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTs]);

  return (
    <div
      className="flex items-center justify-center gap-2 rounded-xl border border-[#8b5cf6]/40 bg-[#8b5cf6]/10 py-3 px-4 text-sm sm:gap-3 sm:py-4 sm:text-base"
      style={{ boxShadow: "0 0 24px rgba(139, 92, 246, 0.2)" }}
    >
      <span className="text-white/90">Oferta expiră în:</span>
      <span className="font-mono font-bold tabular-nums text-white">
        {format(h)}h : {format(m)}m : {format(s)}s
      </span>
    </div>
  );
}
