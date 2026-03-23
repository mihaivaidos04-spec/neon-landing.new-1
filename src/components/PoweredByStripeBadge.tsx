/**
 * “Powered by Stripe” badge — Stripe Blurple (#635BFF), checkout-style rectangular lockup.
 * Links to stripe.com per Stripe’s partner marks guidance.
 */
export default function PoweredByStripeBadge({ className }: { className?: string }) {
  return (
    <a
      href="https://stripe.com"
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label="Powered by Stripe"
    >
      <svg
        width={132}
        height={26}
        viewBox="0 0 132 26"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        className="h-[26px] w-auto max-w-full"
      >
        <title>Powered by Stripe</title>
        <rect width="132" height="26" rx="4" fill="#635BFF" />
        <text
          x="66"
          y="17"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="11"
          fontWeight="600"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        >
          Powered by Stripe
        </text>
      </svg>
    </a>
  );
}
