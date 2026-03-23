"use client";

type Props = {
  locked: boolean;
  onUpgrade: () => void;
  label?: string;
  className?: string;
  children?: React.ReactNode;
};

/**
 * When `locked`, shows a VIP lock affordance; click opens upgrade flow (parent provides `onUpgrade`).
 */
export default function VipFeatureLock({
  locked,
  onUpgrade,
  label = "VIP Only",
  className = "",
  children,
}: Props) {
  if (!locked) {
    return <>{children}</>;
  }
  return (
    <button
      type="button"
      onClick={onUpgrade}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-amber-500/45 bg-amber-950/40 px-2.5 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wide text-amber-100/95 shadow-[0_0_16px_rgba(245,158,11,0.2)] transition hover:border-amber-400/55 hover:bg-amber-950/55 ${className}`}
    >
      <span aria-hidden>🔒</span>
      <span>{label}</span>
      {children}
    </button>
  );
}
