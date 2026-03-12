"use client";

type Props = {
  title: string;
  price: string;
  oldPrice?: string;
  subtitle: string;
  features: string[];
  buttonLabel: string;
  featured?: boolean;
  featuredBadge?: string;
  onSelect: () => void;
  delayClass?: string;
};

const NEON_VIOLET = "#8b5cf6";
const TRUST_TEXT = "Plată Securizată | Acces Instant";

export default function PricingCard({
  title,
  price,
  oldPrice,
  subtitle,
  features,
  buttonLabel,
  featured,
  featuredBadge,
  onSelect,
  delayClass = "",
}: Props) {
  const cardBase =
    "card-neon flex flex-col rounded-2xl p-6 sm:p-8 transition-transform duration-200 hover:scale-[1.02]";
  const cardNormal =
    "border border-white/10 section-reveal " + delayClass;
  const cardFeatured =
    "border-2 section-reveal section-delay-2 relative " + delayClass;
  const btnOutline =
    "btn-cta-pulse mt-6 min-h-[52px] w-full rounded-full border py-3.5 text-base font-semibold text-white transition-all active:scale-[0.98] hover:bg-[#8b5cf6]/20 sm:min-h-[56px]";
  const btnPrimary =
    "btn-cta-pulse mt-6 min-h-[52px] w-full rounded-full py-3.5 text-base font-semibold text-white transition-all active:scale-[0.98] sm:min-h-[56px]";

  return (
    <div
      className={`${cardBase} ${featured ? cardFeatured : cardNormal}`}
      style={
        featured
          ? {
              borderColor: NEON_VIOLET,
              boxShadow:
                "0 0 40px rgba(139, 92, 246, 0.25), inset 0 0 60px rgba(139, 92, 246, 0.05)",
            }
          : undefined
      }
    >
      {featured && (featuredBadge ?? "Cel mai ales") && (
        <span
          className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider text-white"
          style={{ background: NEON_VIOLET }}
        >
          {featuredBadge}
        </span>
      )}
      <h3 className="text-lg font-semibold text-white sm:text-xl">{title}</h3>
      <div className="mt-2 flex flex-wrap items-baseline gap-2">
        {oldPrice && (
          <span className="text-lg text-white/50 line-through sm:text-xl">
            {oldPrice}
          </span>
        )}
        <span className="text-3xl font-bold text-white sm:text-4xl">{price}</span>
      </div>
      <p className={`mt-2 text-sm ${featured ? "text-white/90" : "text-white/70"}`}>
        {subtitle}
      </p>
      <ul className="mt-6 flex-1 space-y-3 text-sm text-white/80">
        {features.map((f) => (
          <li key={f}>• {f}</li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onSelect}
        className={featured ? btnPrimary : btnOutline}
        style={
          featured
            ? { background: NEON_VIOLET, boxShadow: "0 0 24px rgba(139, 92, 246, 0.5)" }
            : { borderColor: NEON_VIOLET, boxShadow: "0 0 20px rgba(139, 92, 246, 0.3)" }
        }
      >
        {buttonLabel}
      </button>
      <p className="mt-3 text-center text-xs text-white/60">{TRUST_TEXT}</p>
    </div>
  );
}
