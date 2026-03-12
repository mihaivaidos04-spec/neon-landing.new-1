"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowser } from "../lib/supabase-browser";
import { getContentT } from "../lib/content-i18n";
import type { ContentLocale } from "../lib/content-i18n";
import type { GlobalNotificationType } from "../lib/global-notifications";

type NotificationPayload = {
  type: GlobalNotificationType;
  user_name: string;
};

const TOAST_DURATION_MS = 5000;

type Props = {
  locale?: ContentLocale;
};

function formatMessage(
  template: string,
  user: string
): string {
  return template.replace(/\{\{user\}\}/g, user);
}

export default function GlobalNotificationToast({ locale = "ro" }: Props) {
  const [toast, setToast] = useState<{ message: string } | null>(null);
  const t = getContentT(locale);

  const showMessage = useCallback(
    (type: GlobalNotificationType, userName: string) => {
      const template =
        type === "god_mode" ? t.globalNotifyGodMode : t.globalNotifyStreak7;
      const message = formatMessage(template, userName);
      setToast({ message });
      const timeout = setTimeout(() => setToast(null), TOAST_DURATION_MS);
      return () => clearTimeout(timeout);
    },
    [t.globalNotifyGodMode, t.globalNotifyStreak7]
  );

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    const channel = supabase
      .channel("global-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "global_notifications",
        },
        (payload) => {
          const row = payload.new as NotificationPayload;
          if (row?.type && row?.user_name) {
            showMessage(row.type, row.user_name);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showMessage]);

  if (!toast) return null;

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-[60] mx-auto max-w-md rounded-xl border border-[#8b5cf6]/40 bg-black/95 px-4 py-3 shadow-[0_0_30px_rgba(139,92,246,0.3)] sm:bottom-24 sm:left-auto sm:right-6"
      role="status"
      aria-live="polite"
    >
      <p className="text-center text-sm font-medium text-white">
        {toast.message}
      </p>
    </div>
  );
}
