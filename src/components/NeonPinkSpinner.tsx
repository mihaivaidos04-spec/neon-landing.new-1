"use client";

type Props = {
  className?: string;
  label?: string;
  labelClassName?: string;
};

export default function NeonPinkSpinner({ className = "", label, labelClassName }: Props) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-fuchsia-500/20 border-t-fuchsia-400"
        aria-hidden
      />
      {label ? (
        <span className={`text-sm ${labelClassName ?? "text-white/80"}`}>{label}</span>
      ) : null}
    </span>
  );
}
