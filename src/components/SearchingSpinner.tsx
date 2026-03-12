"use client";

type Props = {
  label: string;
};

export default function SearchingSpinner({ label }: Props) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-xl bg-black/80 backdrop-blur-sm">
      <div className="searching-spinner" />
      <p className="text-sm font-medium text-white/90">{label}</p>
    </div>
  );
}
