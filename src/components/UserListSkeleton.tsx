"use client";

type Props = {
  count?: number;
};

export default function UserListSkeleton({ count = 4 }: Props) {
  return (
    <div className="flex gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <div className="h-16 w-16 animate-pulse rounded-full bg-white/10" />
          <div className="h-6 w-16 animate-pulse rounded bg-white/10" />
        </div>
      ))}
    </div>
  );
}
