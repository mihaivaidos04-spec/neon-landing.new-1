"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const STORAGE_KEY = "neon_last_visit";
const THRESHOLD_MS = 6 * 60 * 60 * 1000; // 6 hours

export default function WelcomeBackMoment() {
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    if (triggered) return;
    const now = Date.now();
    const last = parseInt(localStorage.getItem(STORAGE_KEY) ?? "0", 10);
    localStorage.setItem(STORAGE_KEY, String(now));

    if (last > 0 && now - last > THRESHOLD_MS) {
      setTriggered(true);
      toast(
        (t) => (
          <div className="flex flex-col gap-1">
            <span className="font-medium">Welcome back.</span>
            <span className="text-sm text-white/70">The neon waits for you.</span>
          </div>
        ),
        {
          duration: 5000,
          style: {
            background: "linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(5, 5, 8, 0.95) 100%)",
            border: "1px solid rgba(139, 92, 246, 0.3)",
            boxShadow: "0 0 30px rgba(139, 92, 246, 0.2)",
          },
        }
      );
    }
  }, [triggered]);

  return null;
}
