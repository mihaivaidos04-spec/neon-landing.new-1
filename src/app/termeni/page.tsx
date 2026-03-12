import { headers } from "next/headers";
import Link from "next/link";
import { getTermsContent, resolveLegalLocale } from "../../lib/legal-i18n";

export const metadata = {
  title: "Termeni și Condiții • NEON",
  description: "Termeni și Condiții de utilizare a platformei NEON.",
};

type Props = { searchParams: Promise<{ lang?: string }> };

export default async function TermeniPage({ searchParams }: Props) {
  const params = await searchParams;
  const headersList = await headers();
  const locale = resolveLegalLocale(
    params.lang ?? null,
    headersList.get("accept-language")
  );
  const content = getTermsContent(locale);
  const sections = content.sections;

  return (
    <div className="min-h-screen bg-black text-white antialiased">
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(139, 92, 246, 0.15) 0%, transparent 60%)",
        }}
      />
      <main className="relative z-10 mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="mb-6 text-sm text-white/50">{content.lastUpdated}</p>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {content.title}
        </h1>
        <p className="mt-4 text-white/80">{content.intro}</p>

        <section className="mt-10 space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-white">{sections.eligibility.title}</h2>
            <p className="mt-2 text-white/75">{sections.eligibility.body}</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{sections.account.title}</h2>
            <p className="mt-2 text-white/75">{sections.account.body}</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{sections.conduct.title}</h2>
            <p className="mt-2 text-white/75">{sections.conduct.body}</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{sections.intellectualProperty.title}</h2>
            <p className="mt-2 text-white/75">{sections.intellectualProperty.body}</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{sections.digitalNoRefund.title}</h2>
            <p className="mt-2 text-white/75">{sections.digitalNoRefund.body}</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{sections.limitationOfLiability.title}</h2>
            <p className="mt-2 text-white/75">{sections.limitationOfLiability.body}</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{sections.changesAndLaw.title}</h2>
            <p className="mt-2 text-white/75">{sections.changesAndLaw.body}</p>
          </div>
        </section>

        <nav className="mt-14 flex flex-wrap gap-4 border-t border-white/10 pt-8">
          <Link
            href="/gdpr"
            className="text-[#8b5cf6] underline hover:opacity-90"
          >
            Politica de Confidențialitate (GDPR)
          </Link>
          <Link
            href="/"
            className="text-white/70 underline hover:text-white"
          >
            Înapoi la NEON
          </Link>
        </nav>
      </main>
    </div>
  );
}
