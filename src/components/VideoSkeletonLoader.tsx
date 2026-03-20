"use client";

export default function VideoSkeletonLoader() {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center bg-zinc-950/90"
      aria-hidden
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-14 w-14 animate-spin rounded-full border-[3px] border-fuchsia-500/15 border-t-fuchsia-400 shadow-[0_0_24px_rgba(236,72,153,0.4)]" />
        <p className="text-xs font-medium uppercase tracking-wider text-fuchsia-200/70">Loading stream…</p>
      </div>
    </div>
  );
}
