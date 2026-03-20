"use client";

type Props = {
  /** Show only on main dashboard (landing) */
  visible: boolean;
  authenticated: boolean;
  onOpenShop: () => void;
  onOpenLogin: () => void;
  onOpenMenu: () => void;
};

function NavBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[48px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/75 transition active:scale-[0.97] active:bg-white/10"
    >
      <span className="flex h-7 w-7 items-center justify-center text-violet-300/95 [&>svg]:h-5 [&>svg]:w-5">
        {children}
      </span>
      <span className="max-w-[4.5rem] truncate">{label}</span>
    </button>
  );
}

export default function MobileBottomNav({
  visible,
  authenticated,
  onOpenShop,
  onOpenLogin,
  onOpenMenu,
}: Props) {
  if (!visible) return null;

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const scrollStage = () =>
    document.getElementById("neon-stage")?.scrollIntoView({ behavior: "smooth", block: "start" });
  const scrollPulse = () => {
    if (!authenticated) {
      onOpenLogin();
      return;
    }
    document.getElementById("global-pulse")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[60] border-t border-violet-500/25 bg-[#06060a]/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl lg:hidden"
      aria-label="Primary mobile navigation"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-between px-1">
        <NavBtn label="Home" onClick={scrollTop}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        </NavBtn>
        <NavBtn label="Live" onClick={scrollStage}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </NavBtn>
        <NavBtn label="Shop" onClick={onOpenShop}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </NavBtn>
        <NavBtn label="Pulse" onClick={scrollPulse}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </NavBtn>
        <NavBtn label="Menu" onClick={onOpenMenu}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </NavBtn>
      </div>
    </nav>
  );
}
