"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "neon-landing-activity-dismissed";

const names = [
  "Alex",
  "Maria",
  "Lucas",
  "Sofia",
  "James",
  "Emma",
  "Mateo",
  "Giulia",
  "Arjun",
  "Yuki",
  "Pedro",
  "Lena",
];

const countries = [
  "🇧🇷 Brazil",
  "🇺🇸 USA",
  "🇮🇳 India",
  "🇩🇪 Germany",
  "🇲🇽 Mexico",
  "🇫🇷 France",
  "🇯🇵 Japan",
  "🇮🇩 Indonesia",
  "🇵🇭 Philippines",
  "🇷🇴 Romania",
];

const FADE_MS = 400;
const VISIBLE_MS = 4000;

function randomGapMs() {
  return 8000 + Math.random() * 4000;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomMessage(): string {
  const name = pick(names);
  const country = pick(countries);
  const partnerCountry = pick(countries);
  const templates = [
    `🟢 ${name} from ${country} just joined`,
    `💎 ${name} upgraded to VIP Gold`,
    `🎁 ${name} sent a gift to a stranger`,
    `🌍 ${name} is now chatting with someone from ${partnerCountry}`,
    `⭐ ${name} just earned the Veteran badge`,
  ];
  return pick(templates);
}

export default function LandingActivityFeed() {
  const [dismissed, setDismissed] = useState(false);
  const [text, setText] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") setDismissed(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (dismissed) return;

    const timeouts: ReturnType<typeof setTimeout>[] = [];
    let cancelled = false;

    const t = (fn: () => void, ms: number) => {
      const id = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
      timeouts.push(id);
    };

    /** One popup: fade in → hold → fade out → wait 8–12s → repeat */
    const showSequence = () => {
      if (cancelled) return;
      setText(randomMessage());
      setVisible(true);
      t(() => {
        if (cancelled) return;
        setVisible(false);
        t(() => {
          if (cancelled) return;
          t(showSequence, randomGapMs());
        }, FADE_MS);
      }, FADE_MS + VISIBLE_MS);
    };

    t(showSequence, randomGapMs());

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, [dismissed]);

  const dismiss = () => {
    setDismissed(true);
    setVisible(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  if (dismissed) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-[max(1rem,env(safe-area-inset-bottom,0px))] left-[max(1rem,env(safe-area-inset-left,0px))] z-[80] w-[min(calc(100vw-2rem),20rem)]"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className={`pointer-events-auto rounded-xl border border-white/15 bg-black/85 px-3.5 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.55)] backdrop-blur-md transition-opacity duration-[400ms] ease-out ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex gap-2">
          <p className="min-w-0 flex-1 text-left text-[12px] leading-snug text-white/90">{text}</p>
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 rounded-md p-0.5 text-white/45 transition hover:bg-white/10 hover:text-white/90"
            aria-label="Dismiss activity feed"
          >
            <span className="block text-base leading-none" aria-hidden>
              ×
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
