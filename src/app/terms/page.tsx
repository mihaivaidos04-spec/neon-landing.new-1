import Link from "next/link";

export const metadata = {
  title: "Terms of Service | NEON",
  description: "Terms of service and conditions of use for the NEON platform.",
};

const CONTACT_EMAIL = "contact@neon-platform.com";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <Link
          href="/"
          className="mb-8 inline-block text-sm text-white/60 underline hover:text-white/90"
        >
          ← Back
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-white/60">Last updated: 2026</p>

        <div className="mt-10 space-y-10 text-white/90">
          <section>
            <h2 className="text-lg font-medium text-white sm:text-xl">
              Platform Purpose
            </h2>
            <p className="mt-3 leading-relaxed">
              NEON is a platform intended for <strong>digital entertainment</strong> only.
              All services, virtual currency, and digital rewards are provided for
              in-app use and have no cash value. By using NEON, you acknowledge
              that the platform is designed for entertainment purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white sm:text-xl">
              Digital Rewards – No Refunds
            </h2>
            <p className="mt-3 leading-relaxed">
              <strong>All purchases of Digital Rewards are final.</strong> Once the
              decryption process is available, the digital service is considered
              consumed and non-refundable. Digital Rewards (e.g. Chat Time, Golden
              Avatar Border, Extended Battery) are delivered instantly upon
              decryption and cannot be reversed or refunded.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white sm:text-xl">
              Minimum Age
            </h2>
            <p className="mt-3 leading-relaxed">
              Access to the platform is strictly prohibited for persons under 18.
              By using NEON, you confirm that you meet the minimum legal age. We
              reserve the right to verify age and close any account that violates
              this condition.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white sm:text-xl">
              Virtual Currency (Coins)
            </h2>
            <p className="mt-3 leading-relaxed">
              Coins are an internal virtual currency and{" "}
              <strong>have no real monetary value</strong>. They cannot be
              exchanged for cash or withdrawn. They are usable exclusively within
              the NEON platform for the offered features (gifts, filters, etc.).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white sm:text-xl">
              Contact
            </h2>
            <p className="mt-3 leading-relaxed">
              For questions regarding these Terms of Service or the platform,
              please contact us at:{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-emerald-400 underline hover:text-emerald-300"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
          </section>
        </div>

        <p className="mt-14 text-center text-xs text-white/40">
          © 2026 NEON Interactive. All rights reserved.
        </p>
      </div>
    </div>
  );
}
