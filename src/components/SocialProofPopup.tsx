"use client";

import { useEffect, useRef, useState } from "react";
import { buildNotification } from "../lib/social-proof-data";
import type { ContentLocale } from "../lib/content-i18n";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function SocialProofPopup({ locale = "ro" }: { locale?: ContentLocale }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [timeLabel, setTimeLabel] = useState("");

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const show = () => {
      const { message: msg, timeLabel: time } = buildNotification(locale);
      setMessage(msg);
      setTimeLabel(time);
      setVisible(true);
      const hideAt = 4000 + Math.random() * 1000;
      const nextAt = 35000 + Math.random() * 20000;
      const hideId = setTimeout(() => setVisible(false), hideAt);
      const nextId = setTimeout(show, nextAt);
      timers.current.push(hideId, nextId);
    };
    const firstId = setTimeout(show, 20000 + Math.random() * 15000);
    timers.current.push(firstId);
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [locale]);

  if (!visible || !message) return null;

  return (
    <div
      className="card-neon notification-popup fixed bottom-4 left-4 z-50 max-w-[280px] rounded-lg border border-white/5 px-3 py-2 text-white/90 sm:bottom-6 sm:left-6"
    >
      <p className="notification-time text-[10px] uppercase tracking-wider text-white/50">
        {timeLabel}
      </p>
      <p className="notification-handwritten mt-1 text-sm text-white/95">
        {message}
      </p>
    </div>
  );
}
