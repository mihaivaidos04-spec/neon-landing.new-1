"use client";

import dynamic from "next/dynamic";

/** Deferred UserFlag chunk — placeholder matches final size (globe) */
const UserFlag = dynamic(() => import("./UserFlag"), {
  ssr: false,
  loading: () => (
    <span
      className="inline-flex h-3 w-[18px] shrink-0 items-center justify-center rounded-[2px] bg-white/[0.08] ring-1 ring-white/10"
      aria-hidden
    >
      <svg
        width={13}
        height={13}
        viewBox="0 0 24 24"
        className="text-white/50"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    </span>
  ),
});

export default UserFlag;
