import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | NEON",
  description: "Privacy policy and data protection for NEON.",
};

const CONTACT_EMAIL = "contact@neon-platform.com";

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-white/60">Last updated: 2026</p>

        <div className="mt-10 space-y-10 text-white/90">
          <section>
            <h2 className="text-lg font-medium text-white sm:text-xl">
              Data We Collect
            </h2>
            <p className="mt-3 leading-relaxed">
              We collect only the data necessary for authentication and security:
              email address and name provided through social login (Google, Apple,
              etc.), as well as IP address for abuse prevention and platform
              security. We do not sell or share this data with third parties for
              marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white sm:text-xl">
              Video Streaming
            </h2>
            <p className="mt-3 leading-relaxed">
              Video is streamed directly between participants (Peer-to-Peer, P2P)
              and <strong>is not recorded</strong> and{" "}
              <strong>is not stored</strong> on our servers. User anonymity is
              our top priority. We do not keep video recordings of conversations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white sm:text-xl">
              Payments & Card Data
            </h2>
            <p className="mt-3 leading-relaxed">
              Payment processing is handled entirely by{" "}
              <strong>Lemon Squeezy</strong> (lemonsqueezy.com), a third-party
              payment provider. <strong>We do not store</strong> credit card
              numbers, CVV codes, or any other sensitive payment data. NEON does
              not have access to your full payment details. We only receive
              transaction confirmation (amount, date, product type) to credit your
              account. For payment-related questions, contact Lemon Squeezy or
              refer to their privacy policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white sm:text-xl">
              Digital Entertainment
            </h2>
            <p className="mt-3 leading-relaxed">
              NEON is a platform for digital entertainment. Digital items have no
              cash value and are for in-app use only.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white sm:text-xl">
              Your Rights (GDPR)
            </h2>
            <p className="mt-3 leading-relaxed">
              You have the right to access, rectify, and delete your data. You
              may request account and data deletion from your account settings.
              After confirmation, we will permanently delete all personal data
              from our systems, in accordance with the General Data Protection
              Regulation (GDPR).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white sm:text-xl">
              Contact
            </h2>
            <p className="mt-3 leading-relaxed">
              For privacy-related inquiries, contact us at:{" "}
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
