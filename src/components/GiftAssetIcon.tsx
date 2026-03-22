"use client";

type GiftVisualId =
  | "heart"
  | "rose"
  | "coffee"
  | "diamond"
  | "fire"
  | "rocket"
  | "like"
  | "sparkle"
  | "fireworks";

type Props = {
  id: GiftVisualId;
  size?: number;
  className?: string;
};

function iconStyle(className: string | undefined): string {
  return `drop-shadow-[0_0_10px_rgba(236,72,153,0.4)] ${className ?? ""}`.trim();
}

export default function GiftAssetIcon({ id, size = 28, className }: Props) {
  if (id === "heart") {
    return (
      <svg className={iconStyle(className)} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 21s-7.2-4.6-9.3-8.7C1.1 9.2 2.4 5.5 6 4.7c2.2-.5 4 0.4 6 2.5 2-2.1 3.8-3 6-2.5 3.6.8 4.9 4.5 3.3 7.6C19.2 16.4 12 21 12 21z"
          fill="url(#heartFill)"
        />
        <defs>
          <linearGradient id="heartFill" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fb7185" />
            <stop offset="1" stopColor="#f43f5e" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  if (id === "rose") {
    return (
      <svg className={iconStyle(className)} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 3c2.5 0 4.5 1.8 4.5 4.1 0 1.8-1.2 3.1-2.7 3.7.5 2-1 3.9-3.3 3.9-2.4 0-4-2-3.3-3.9C5.7 10.2 4.5 8.9 4.5 7.1 4.5 4.8 6.5 3 9 3c1.2 0 2.2.4 3 .9.8-.5 1.8-.9 3-.9z" fill="url(#roseTop)" />
        <path d="M12 14v6M12 20l-2 1M12 20l2 1" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" />
        <defs>
          <linearGradient id="roseTop" x1="5" y1="4" x2="17" y2="14" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fda4af" />
            <stop offset="1" stopColor="#e11d48" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  if (id === "coffee") {
    return (
      <svg className={iconStyle(className)} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="5" y="9" width="11" height="8" rx="2.5" fill="url(#coffeeCup)" />
        <path d="M16 10h1.7a2.3 2.3 0 0 1 0 4.6H16" stroke="#f5d0a6" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M8 6.5c0-1 .8-1.8 1.8-1.8M11 6c0-1 .8-1.8 1.8-1.8" stroke="#f59e0b" strokeWidth="1.2" strokeLinecap="round" />
        <defs>
          <linearGradient id="coffeeCup" x1="5" y1="9" x2="16" y2="17" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fbbf24" />
            <stop offset="1" stopColor="#b45309" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  if (id === "diamond") {
    return (
      <svg className={iconStyle(className)} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M6 9.5 12 3l6 6.5-6 11-6-11z" fill="url(#diamondFill)" />
        <path d="M6 9.5h12M12 3v17.5" stroke="#c4b5fd" strokeWidth="1.1" opacity="0.75" />
        <defs>
          <linearGradient id="diamondFill" x1="6" y1="3" x2="18" y2="20.5" gradientUnits="userSpaceOnUse">
            <stop stopColor="#7dd3fc" />
            <stop offset="0.55" stopColor="#c084fc" />
            <stop offset="1" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  if (id === "fire") {
    return (
      <svg className={iconStyle(className)} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 22c4.1 0 7-3 7-7 0-4.9-3.5-7.3-5.2-10.6-.2 2.2-1.3 3.7-3.1 5-1 1-2.2 2.4-2.2 4.6 0 2.2 1.5 4 3.5 4 2.1 0 3.6-1.7 3.6-3.9 0-1.4-.7-2.4-1.7-3.2.1 1.8-.9 3.3-2.5 3.3-1.4 0-2.4-1.2-2.4-2.8 0-1.1.5-2 1.4-2.9C8.9 10.1 5 12.5 5 16c0 3.5 3 6 7 6z" fill="url(#fireFill)" />
        <defs>
          <linearGradient id="fireFill" x1="7" y1="5" x2="18" y2="21" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fb923c" />
            <stop offset="1" stopColor="#ef4444" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  if (id === "rocket") {
    return (
      <svg className={iconStyle(className)} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M14.2 4.2c3.3 1.1 5.5 3.3 6.6 6.6l-5.2 1.4-2.8-2.8 1.4-5.2z" fill="#7c3aed" />
        <path d="M6 18l3.5-8.1 4.6-1.3 2.3 2.3-1.3 4.6L7 19l-1 2-2-2 2-1z" fill="url(#rocketFill)" />
        <circle cx="13.4" cy="10.6" r="1.2" fill="#e0e7ff" />
        <defs>
          <linearGradient id="rocketFill" x1="6" y1="8.6" x2="16.4" y2="19.4" gradientUnits="userSpaceOnUse">
            <stop stopColor="#22d3ee" />
            <stop offset="1" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  if (id === "like") {
    return (
      <svg className={iconStyle(className)} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M8.2 10.5V20H5a1.5 1.5 0 0 1-1.5-1.5v-6.5A1.5 1.5 0 0 1 5 10.5h3.2z" fill="#60a5fa" />
        <path d="M9.4 20H17a2 2 0 0 0 1.9-1.5l1.1-4.5A2 2 0 0 0 18 11h-4.2l.4-2.5a2.6 2.6 0 0 0-5.1-.9L8 10.5v8.2l1.4 1.3z" fill="url(#likeFill)" />
        <defs>
          <linearGradient id="likeFill" x1="8" y1="7" x2="20" y2="20" gradientUnits="userSpaceOnUse">
            <stop stopColor="#93c5fd" />
            <stop offset="1" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  if (id === "sparkle") {
    return (
      <svg className={iconStyle(className)} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="m12 2 2.1 5.9L20 10l-5.9 2.1L12 18l-2.1-5.9L4 10l5.9-2.1L12 2z" fill="url(#sparkleFill)" />
        <path d="m18.5 14.5.9 2.2 2.1.9-2.1.8-.9 2.2-.8-2.2-2.2-.8 2.2-.9.8-2.2z" fill="#fef08a" />
        <defs>
          <linearGradient id="sparkleFill" x1="4" y1="2" x2="20" y2="18" gradientUnits="userSpaceOnUse">
            <stop stopColor="#22d3ee" />
            <stop offset="1" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  if (id === "fireworks") {
    return (
      <svg className={iconStyle(className)} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="8" cy="8" r="1.7" fill="#f472b6" />
        <circle cx="16" cy="6" r="1.5" fill="#22d3ee" />
        <circle cx="15" cy="14" r="2.1" fill="#f59e0b" />
        <path d="M8 3v2M8 11v2M3 8h2M11 8h2M5 5l1.3 1.3M10.7 9.7 12 11M5 11l1.3-1.3M10.7 6.3 12 5" stroke="#f9a8d4" strokeWidth="1.1" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" fill="#a855f7" />
    </svg>
  );
}
