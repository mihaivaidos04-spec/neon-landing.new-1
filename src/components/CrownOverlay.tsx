"use client";

type Props = {
  visible: boolean;
  /** Position: "partner" = main video, "self" = corner self-view */
  position: "partner" | "self";
};

export default function CrownOverlay({ visible, position }: Props) {
  if (!visible) return null;

  const isPartner = position === "partner";

  return (
    <div
      className="pointer-events-none absolute z-30 flex items-center justify-center"
      style={
        isPartner
          ? { inset: 0 }
          : { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
      }
    >
      <svg
        className={isPartner ? "h-16 w-16 sm:h-20 sm:w-20" : "h-8 w-8"}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M12 2L14 8H20L16 12L18 22L12 18L6 22L8 12L4 8H10L12 2Z"
          fill="url(#crown-grad)"
          stroke="#fbbf24"
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="crown-grad" x1="4" y1="2" x2="20" y2="22">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
