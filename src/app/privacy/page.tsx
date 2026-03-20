import type { Metadata } from "next";
import LegalShell from "@/src/components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Privacy Policy & GDPR | NeonLive",
  description:
    "How NeonLive handles your email, account data, and payments. We never store full card numbers—Stripe does. Your rights including deletion and data access.",
  keywords: [
    "NeonLive privacy",
    "GDPR",
    "data protection",
    "Stripe",
    "Neon Coins",
    "delete account",
  ],
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

const UPDATED = "March 12, 2026";
const CONTACT = "privacy@neonlive.chat";
const DPO = "privacy@neonlive.chat";

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" lastUpdated={UPDATED}>
      <section id="who">
        <h2>1. Who we are</h2>
        <p>
          NeonLive is a <strong>digital gifting platform for creators</strong>—live sessions, virtual
          gifts, and in-app features. This policy explains, in plain language, what we collect, why we
          collect it, and what you can do about it.
        </p>
      </section>

      <section id="gdpr-summary">
        <h2>2. GDPR &amp; your personal data (simple summary)</h2>
        <p>
          If you live in the EEA, UK, or similar regions, data protection law (like the GDPR) gives you
          rights over your information. The sections below spell out what we hold and how to use your
          rights. This summary is for clarity—it does not replace the full policy or your legal rights.
        </p>

        <h3 className="mt-6 border-0 pb-0 text-base font-semibold text-white">What we collect (main categories)</h3>
        <ul>
          <li>
            <strong>Email address</strong> — when you sign in (e.g. with Google) or contact us. We use it
            to identify your account, send important service messages, and respond to support.
          </li>
          <li>
            <strong>User ID</strong> — a unique identifier we assign (or that comes from your sign-in
            provider) so we can link your profile, wallet, gifts, and settings to you.
          </li>
          <li>
            <strong>Transaction history</strong> — records of Neon Coin purchases, virtual gifts, and
            related activity so we can run the service, show balances, and prevent fraud or abuse.
          </li>
        </ul>

        <h3 className="mt-6 border-0 pb-0 text-base font-semibold text-white">Payment cards — we do NOT store them</h3>
        <p>
          <strong>We do not store your credit or debit card number on our servers.</strong> Payments go
          through <strong>Stripe</strong>. You enter card details on Stripe&apos;s checkout (or Apple Pay /
          Google Pay). We only receive what Stripe needs to confirm the payment (such as status, amount,
          and sometimes last four digits or brand)—not your full card number.
        </p>

        <h3 className="mt-6 border-0 pb-0 text-base font-semibold text-white">Why we use this data</h3>
        <ul>
          <li>
            <strong>To run NeonLive</strong> — log you in, show your balance, deliver gifts and features.
          </li>
          <li>
            <strong>To keep payments safe</strong> — detect fraud, fix billing errors, and meet financial
            record-keeping rules where required.
          </li>
          <li>
            <strong>To improve and secure the product</strong> — fix bugs, prevent abuse, and understand
            how the app is used (often in aggregated form).
          </li>
        </ul>

        <h3 className="mt-6 border-0 pb-0 text-base font-semibold text-white">Your rights</h3>
        <ul>
          <li>
            <strong>Access</strong> — you can ask what personal data we hold about you. Contact us at the
            email below; we will respond within reasonable timeframes required by law.
          </li>
          <li>
            <strong>Correction</strong> — if something is wrong (e.g. email), ask us to fix it.
          </li>
          <li>
            <strong>Deletion (&quot;right to be forgotten&quot;)</strong> — you may ask us to delete your
            account and associated personal data, subject to legal exceptions (e.g. we may need to keep
            certain billing records for tax or fraud prevention). Where the app offers a{" "}
            <strong>Delete account</strong> (or similar) control, you can start the process there; you can
            also email us. Some information may be retained if the law requires it or if it is anonymized.
          </li>
          <li>
            <strong>Object or restrict</strong> — in some cases you can object to certain processing or ask
            us to limit use of your data.
          </li>
          <li>
            <strong>Complaint</strong> — you may complain to your local data protection authority.
          </li>
        </ul>
      </section>

      <section id="collect-detail">
        <h2>3. Data we collect (detail)</h2>
        <ul>
          <li>
            <strong>Account:</strong> name, email, profile image, provider IDs from Google or other login
            methods you choose.
          </li>
          <li>
            <strong>Technical:</strong> IP address, device type, approximate region, cookies, logs—for
            security, debugging, and (where allowed) analytics.
          </li>
          <li>
            <strong>Payments:</strong> processed by Stripe; we receive limited payment metadata as
            described above, not full card numbers.
          </li>
          <li>
            <strong>Content you add:</strong> text, preferences, and similar inputs you give us in the app.
          </li>
        </ul>
      </section>

      <section id="stripe-cards">
        <h2>4. Payment card data (Stripe only)</h2>
        <p>
          Card data is entered and processed <strong>only on Stripe&apos;s systems</strong> (or your
          wallet app). Read how Stripe handles data:{" "}
          <a
            href="https://stripe.com/privacy"
            className="text-violet-400 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            stripe.com/privacy
          </a>
          .
        </p>
      </section>

      <section id="use">
        <h2>5. How we use data</h2>
        <ul>
          <li>Provide and improve NeonLive;</li>
          <li>Process payments and prevent fraud;</li>
          <li>Communicate about your account and support;</li>
          <li>Enforce our Terms and comply with law.</li>
        </ul>
      </section>

      <section id="legal-bases">
        <h2>6. Legal bases (EEA/UK)</h2>
        <p>
          Where GDPR applies: <strong>contract</strong> (running the service you asked for),{" "}
          <strong>legitimate interests</strong> (security, anti-fraud, product improvement—balanced with
          your rights), <strong>legal obligation</strong>, and <strong>consent</strong> where required
          (e.g. some cookies or marketing).
        </p>
      </section>

      <section id="live-media">
        <h2>7. Live features &amp; media</h2>
        <p>
          Live video/audio may be processed in real time to deliver the service. We aim to{" "}
          <strong>minimize retention</strong> of live media; we do not use live sessions for unrelated ad
          profiling.
        </p>
      </section>

      <section id="sharing">
        <h2>8. Sharing &amp; processors</h2>
        <p>
          We use providers such as <strong>Stripe</strong>, hosting, email, and analytics under contracts.
          We may disclose information if the law requires it. We do not sell your personal data as
          defined by common U.S. state privacy laws.
        </p>
      </section>

      <section id="transfers">
        <h2>9. International transfers</h2>
        <p>
          If data moves across borders, we use safeguards (such as Standard Contractual Clauses) where
          required.
        </p>
      </section>

      <section id="retention">
        <h2>10. Retention</h2>
        <p>
          We keep data only as long as needed for the purposes above and for legal, tax, or dispute
          reasons. Transaction-related records may be kept longer where the law requires.
        </p>
      </section>

      <section id="children">
        <h2>11. Children</h2>
        <p>
          NeonLive is not aimed at children under 16. We do not knowingly collect data from children. Contact
          us if you believe a child has signed up.
        </p>
      </section>

      <section id="security">
        <h2>12. Security</h2>
        <p>
          We use technical and organizational measures appropriate to the risk. No online service is 100%
          secure—use a strong, unique password where applicable.
        </p>
      </section>

      <section id="cookies">
        <h2>13. Cookies &amp; similar tech</h2>
        <p>
          We use cookies and similar technologies for login sessions, preferences, security, and (where you
          consent) analytics or ads. You can control some choices via our cookie banner and your browser
          settings.
        </p>
      </section>

      <section id="changes">
        <h2>14. Changes</h2>
        <p>
          We may update this policy and change the &quot;Last updated&quot; date. Important changes may be
          communicated as required by law.
        </p>
      </section>

      <section id="contact">
        <h2>15. Contact &amp; DPO</h2>
        <p>
          Privacy questions:{" "}
          <a href={`mailto:${CONTACT}`} className="text-violet-400 underline">
            {CONTACT}
          </a>
          <br />
          Data protection contact:{" "}
          <a href={`mailto:${DPO}`} className="text-violet-400 underline">
            {DPO}
          </a>
        </p>
      </section>
    </LegalShell>
  );
}
