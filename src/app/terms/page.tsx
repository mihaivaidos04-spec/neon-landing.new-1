import type { Metadata } from "next";
import LegalShell from "@/src/components/legal/LegalShell";

const SITE = "https://www.neonchat.live";

export const metadata: Metadata = {
  title: "Terms of Service | NeonLive — Digital Gifting for Creators",
  description:
    "NeonLive terms of service: virtual gifts, Neon Coins, creator tools, and live features. Neon Coins are virtual goods with no cash value and are non-refundable once used.",
  keywords: [
    "NeonLive",
    "terms of service",
    "creator gifts",
    "virtual gifts",
    "Neon Coins",
    "digital goods",
    "live streaming",
  ],
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "Terms of Service | NeonLive",
    description:
      "Terms for NeonLive — a digital gifting platform for creators. Neon Coins are virtual goods with no cash value.",
    url: `${SITE}/terms`,
    siteName: "NeonLive",
    type: "website",
    locale: "en_US",
  },
  robots: { index: true, follow: true },
};

const UPDATED = "March 12, 2026";
const COMPANY = "NeonLive";
const CONTACT = "legal@neonchat.live";

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" lastUpdated={UPDATED}>
      <section id="agreement">
        <h2>1. Agreement</h2>
        <p>
          These Terms of Service (&quot;Terms&quot;) govern your access to and use of{" "}
          <strong>{COMPANY}</strong> (&quot;NeonLive,&quot; &quot;we,&quot; &quot;us&quot;), a{" "}
          <strong>digital gifting and creator engagement platform</strong> where users can connect in
          live sessions, support creators with <strong>virtual gifts</strong>, and use{" "}
          <strong>Neon Coins</strong> and other in-platform features. By creating an account, purchasing
          digital goods or services, or using our websites and apps, you agree to these Terms.
        </p>
      </section>

      <section id="neon-coins">
        <h2>2. Neon Coins — virtual goods (no cash value)</h2>
        <p>
          <strong>Neon Coins</strong> are <strong>virtual goods</strong> and <strong>digital content</strong>{" "}
          used only inside NeonLive (for example: sending virtual gifts to creators, unlocking features, or
          optional enhancements). Neon Coins <strong>are not legal tender</strong>, have{" "}
          <strong>no cash value outside the platform</strong>, cannot be redeemed for real money except
          where we are legally required to allow it, and are <strong>not transferable</strong> to other
          users or third parties except as we expressly allow in writing.
        </p>
        <p>
          <strong>Neon Coins are generally non-refundable</strong> after they have been delivered to your
          account or consumed—see our{" "}
          <a href="/refunds" className="text-violet-400 underline hover:text-violet-300">
            Refunds policy
          </a>{" "}
          and applicable law in your region.
        </p>
      </section>

      <section id="service">
        <h2>3. Nature of the service</h2>
        <p>
          NeonLive provides software, live connection features, and tools for creators and audiences.
          Virtual gifts, tips, and credits are <strong>licensed for use only within the service</strong>.
          We may update features, pricing, or availability; we will use reasonable efforts to preserve
          continuity for paid entitlements where feasible.
        </p>
      </section>

      <section id="eligibility">
        <h2>4. Eligibility &amp; accounts</h2>
        <p>
          You must be at least 18 years old (or the age of majority where you live) to use paid features
          or send certain gifts. You are responsible for your account security and for activity under your
          credentials. Keep your contact information accurate for billing and legal notices.
        </p>
      </section>

      <section id="payments">
        <h2>5. Payments (Stripe)</h2>
        <p>
          Purchases are processed by <strong>Stripe, Inc.</strong> (or its affiliates). By checking out,
          you agree to Stripe&apos;s terms and our pricing shown at purchase. Prices are in the currency
          displayed and may include applicable taxes. You authorize Stripe and us to charge your selected
          payment method.
        </p>
      </section>

      <section id="digital-finality">
        <h2>6. Digital goods — final sale &amp; withdrawal</h2>
        <p>
          <strong>All purchases of Neon Coins are final and non-refundable</strong> once the digital
          assets are <strong>credited to your account</strong> (your in-platform wallet or balance),
          except where mandatory consumer law in your country requires otherwise.
        </p>
        <p>
          By clicking <strong>&quot;Buy Now&quot;</strong> (or completing checkout), you{" "}
          <strong>expressly acknowledge</strong> that digital content delivery <strong>begins immediately</strong>{" "}
          when payment succeeds and that you <strong>waive any statutory right of withdrawal</strong> (or
          cooling-off period) that would otherwise apply to distance contracts, to the extent permitted by
          applicable law once delivery has started. This helps us document consent in payment disputes
          (including chargebacks).
        </p>
        <p>
          See our{" "}
          <a href="/refunds" className="text-violet-400 underline hover:text-violet-300">
            Refunds policy
          </a>{" "}
          for details and exceptions we may offer at our discretion.
        </p>
      </section>

      <section id="acceptable-use">
        <h2>7. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Violate applicable law or others&apos; rights;</li>
          <li>Harass, abuse, defraud, or endanger users or creators;</li>
          <li>Circumvent security, billing, or access controls;</li>
          <li>Use NeonLive to distribute malware, spam, or unlawful content;</li>
          <li>Scrape, reverse engineer, or overload our systems except as permitted by law.</li>
        </ul>
        <p>
          We may suspend or terminate access for violations. Moderation and safety tools may apply to
          protect the community.
        </p>
      </section>

      <section id="ip">
        <h2>7. Intellectual property</h2>
        <p>
          NeonLive, its branding, software, and materials we provide are owned by us or our licensors. You
          receive a limited, non-exclusive license to use the service under these Terms. You retain rights
          to content you create; you grant us a license to host and display it as needed to operate NeonLive.
        </p>
      </section>

      <section id="disclaimers">
        <h2>9. Disclaimers</h2>
        <p>
          The service is provided <strong>&quot;as is&quot;</strong> to the fullest extent permitted by law.
          We do not guarantee uninterrupted operation. We are not responsible for other users&apos;
          conduct or content; interactions are at your own risk.
        </p>
      </section>

      <section id="liability">
        <h2>10. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, NeonLive and its suppliers are not liable for indirect,
          incidental, special, consequential, or punitive damages, or loss of profits or data. Our aggregate
          liability for claims relating to the service shall not exceed the greater of (a) amounts you paid
          us in the twelve months before the claim or (b) one hundred U.S. dollars (USD $100), except where
          liability cannot be limited by law.
        </p>
      </section>

      <section id="termination">
        <h2>11. Termination</h2>
        <p>
          You may stop using NeonLive at any time. We may suspend or terminate access for breach of these
          Terms or for legal or operational reasons, with notice where required. Provisions that should
          survive (including accrued payment obligations, liability limits, and dispute terms) survive
          termination.
        </p>
      </section>

      <section id="changes">
        <h2>12. Changes</h2>
        <p>
          We may update these Terms. We will post the revised version and the &quot;Last updated&quot;
          date. Material changes may be communicated by email or in-app notice. Continued use after changes
          may constitute acceptance where permitted by law.
        </p>
      </section>

      <section id="law">
        <h2>13. Governing law &amp; disputes</h2>
        <p>
          These Terms are governed by the laws applicable to our operating entity, without regard to
          conflict-of-law principles, except where mandatory consumer protections in your country apply.
        </p>
      </section>

      <section id="contact">
        <h2>14. Contact</h2>
        <p>
          Questions about these Terms:{" "}
          <a href={`mailto:${CONTACT}`} className="text-violet-400 underline">
            {CONTACT}
          </a>
        </p>
      </section>
    </LegalShell>
  );
}
