import type { Metadata } from "next";
import LegalShell from "@/src/components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Refunds & Digital Purchases | NeonLive",
  description:
    "NeonLive refund policy: Neon Coins are non-refundable once credited. Withdrawal waiver for instant digital delivery. Stripe-processed payments.",
  alternates: { canonical: "/refunds" },
  robots: { index: true, follow: true },
};

const UPDATED = "March 12, 2026";
const CONTACT = "support@neonchat.live";

export default function RefundsPage() {
  return (
    <LegalShell title="Refunds &amp; digital purchases" lastUpdated={UPDATED}>
      <section id="digital-final">
        <h2>1. Digital goods — final &amp; non-refundable</h2>
        <p>
          <strong>All purchases of Neon Coins are final and non-refundable</strong> once the digital
          assets are <strong>credited to your account</strong> (your in-platform wallet or balance).
          Neon Coins are <strong>virtual goods</strong> with <strong>no cash value outside NeonLive</strong>.
        </p>
        <p>
          By clicking <strong>&quot;Buy Now&quot;</strong> or completing Stripe Checkout, you{" "}
          <strong>expressly waive</strong> any statutory <strong>right of withdrawal</strong> (or
          cooling-off period) that might otherwise apply to online purchases, <strong>to the extent
          allowed by law</strong>, because <strong>digital content delivery begins immediately</strong>{" "}
          when your payment is confirmed and Neon Coins are delivered. You acknowledge that you lose the
          right to cancel for convenience once delivery has started—consistent with rules for digital
          content in many jurisdictions (e.g. EU consumer rules where applicable).
        </p>
        <p>
          This language supports clear expectations for you, for us, and for <strong>payment disputes</strong>{" "}
          and <strong>chargebacks</strong> reviewed by banks and Stripe. It does not limit rights that{" "}
          <strong>cannot legally be waived</strong> in your country.
        </p>
      </section>

      <section>
        <h2>2. How Neon Coins are delivered</h2>
        <p>
          NeonLive provides <strong>digital content and software services</strong>, including in-platform
          credits used for virtual gifting and features. After successful payment through{" "}
          <strong>Stripe</strong>, entitlements are typically <strong>credited without delay</strong>.
        </p>
      </section>

      <section>
        <h2>3. Statutory withdrawal (EU/UK consumers)</h2>
        <p>
          Consumers in the EEA or UK may normally have 14 days to withdraw from some distance contracts.
          Where the law allows, that right may <strong>end when you consent to immediate delivery</strong>{" "}
          of digital content and <strong>acknowledge loss of withdrawal</strong> once delivery begins—as
          described in section 1.
        </p>
      </section>

      <section>
        <h2>4. When we may still issue a refund or adjustment</h2>
        <p>We may approve a refund or credit, at our sole discretion, when:</p>
        <ul>
          <li>A <strong>technical failure on our side</strong> prevented delivery of purchased coins;</li>
          <li>You were <strong>charged twice in error</strong> or due to a clear processing bug;</li>
          <li>A <strong>court or regulator</strong> requires it, or mandatory <strong>consumer law</strong>{" "}
            in your jurisdiction requires it;</li>
          <li>We offer a <strong>goodwill</strong> resolution (never guaranteed).</li>
        </ul>
      </section>

      <section>
        <h2>5. When we typically do not refund</h2>
        <ul>
          <li>Change of mind after coins are credited or spent;</li>
          <li>Account suspension or termination for breach of our Terms;</li>
          <li>Issues caused by your bank, device, or third parties outside our control—except as required by law.</li>
        </ul>
      </section>

      <section>
        <h2>6. Subscriptions (if added later)</h2>
        <p>
          If we introduce subscriptions, cancelling will stop future billing; past periods are generally
          non-refundable unless stated otherwise or required by law.
        </p>
      </section>

      <section>
        <h2>7. How to contact us</h2>
        <p>
          Email{" "}
          <a href={`mailto:${CONTACT}`} className="text-violet-400 underline">
            {CONTACT}
          </a>{" "}
          with your account email, purchase date, and any Stripe receipt. We aim to reply within{" "}
          <strong>5–10 business days</strong>. Approved refunds go back to the original payment method when
          possible, per Stripe and card network timing.
        </p>
      </section>

      <section>
        <h2>8. Chargebacks</h2>
        <p>
          Please <strong>contact us before disputing a charge with your bank</strong>. Chargebacks after
          you have received and used Neon Coins may be contested with evidence of delivery and your
          acceptance at checkout. Unfounded chargebacks may lead to account restrictions.
        </p>
      </section>

      <section>
        <h2>9. Related policies</h2>
        <p>
          See also our{" "}
          <a href="/terms" className="text-violet-400 underline hover:text-violet-300">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-violet-400 underline hover:text-violet-300">
            Privacy Policy
          </a>
          .
        </p>
      </section>
    </LegalShell>
  );
}
