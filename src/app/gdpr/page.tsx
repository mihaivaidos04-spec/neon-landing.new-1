import { headers } from "next/headers";
import Link from "next/link";
import { getGdprContent, resolveLegalLocale } from "../../lib/legal-i18n";

export const metadata = {
  title: "Politica de Confidențialitate (GDPR) • NEON",
  description: "Politica de confidențialitate și protecția datelor personale pe NEON.",
};

type Props = { searchParams: Promise<{ lang?: string }> };

export default async function GdprPage({ searchParams }: Props) {
  const params = await searchParams;
  const headersList = await headers();
  const locale = resolveLegalLocale(
    params.lang ?? null,
    headersList.get("accept-language")
  );
  const content = getGdprContent(locale);
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
            <h2 className="text-xl font-semibold text-white">{sections.dataController.title}</h2>
            <p className="mt-2 text-white/75">{sections.dataController.body}</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{sections.dataCollected.title}</h2>
            <p className="mt-2 text-white/75">{sections.dataCollected.body}</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{sections.noCardStorage.title}</h2>
            <p className="mt-2 text-white/75">{sections.noCardStorage.body}</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{sections.purposes.title}</h2>
            <p className="mt-2 text-white/75">{sections.purposes.body}</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{sections.legalBasis.title}</h2>
            <p className="mt-2 text-white/75">{sections.legalBasis.body}</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{sections.yourRights.title}</h2>
            <p className="mt-2 text-white/75">{sections.yourRights.body}</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{sections.cookies.title}</h2>
            <p className="mt-2 text-white/75">{sections.cookies.body}</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{sections.securityRetentionContact.title}</h2>
            <p className="mt-2 text-white/75">{sections.securityRetentionContact.body}</p>
          </div>
        </section>

        <nav className="mt-14 flex flex-wrap gap-4 border-t border-white/10 pt-8">
          <Link
            href="/termeni"
            className="text-[#8b5cf6] underline hover:opacity-90"
          >
            Termeni și Condiții
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
