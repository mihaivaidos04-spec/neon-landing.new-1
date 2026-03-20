import Link from "next/link";
import NeonLiveLogo from "@/src/components/NeonLiveLogo";

const LEGAL_LINKS = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/refunds", label: "Refunds & Neon Coins" },
] as const;

export default function LegalShell({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#050508] text-[#faf5eb] antialiased">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.12),transparent)]" />
      <article className="relative mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-violet-400 transition hover:text-violet-300"
          style={{ fontFamily: "var(--font-syne), system-ui" }}
        >
          <span aria-hidden>←</span>
          <span>Back to</span>
          <NeonLiveLogo variant="compact" className="-translate-y-px" as="span" />
        </Link>

        <nav
          aria-label="Legal documents"
          className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 sm:px-6"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-400/90">
            Legal
          </p>
          <ul className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
            {LEGAL_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-sm font-medium text-white/90 underline decoration-violet-500/50 underline-offset-4 transition hover:text-white hover:decoration-violet-400"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <header className="mt-10 border-b border-white/10 pb-8">
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-sm text-white/50">Last updated: {lastUpdated}</p>
        </header>

        <div className="prose prose-invert prose-violet prose-p:leading-relaxed prose-headings:scroll-mt-24 mt-10 max-w-none text-base leading-[1.7] text-white/[0.92] prose-headings:text-white prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-white prose-li:marker:text-violet-400 [&_h2]:mt-12 [&_h2]:border-b [&_h2]:border-white/10 [&_h2]:pb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_section]:scroll-mt-20">
          {children}
        </div>
      </article>
    </div>
  );
}
