"use client";

type Props = {
  label: string;
};

export default function SearchingSpinner({ label }: Props) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-xl bg-black/80 backdrop-blur-sm">
      <div
        className="h-12 w-12 shrink-0 animate-spin rounded-full border-[3px] border-fuchsia-500/20 border-t-fuchsia-400 shadow-[0_0_20px_rgba(244,114,182,0.35)]"
        aria-hidden
      />
      <p className="text-sm font-medium text-white/90">{label}</p>
    </div>
  );
}
