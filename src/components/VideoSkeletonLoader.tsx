"use client";

export default function VideoSkeletonLoader() {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center bg-zinc-900"
      aria-hidden
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-12 w-12 animate-pulse rounded-full bg-zinc-700"
          style={{
            animation: "skeleton-pulse 1.5s ease-in-out infinite",
          }}
        />
        <div className="h-3 w-24 animate-pulse rounded bg-zinc-700/80" />
      </div>
    </div>
  );
}
