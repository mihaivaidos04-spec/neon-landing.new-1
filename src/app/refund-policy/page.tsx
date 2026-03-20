import type { Metadata } from "next";
import LegalShell from "@/src/components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Refund Policy | NeonLive",
  description:
    "Refund and cancellation policy for NeonLive digital services and platform credits, processed via Stripe.",
};

const UPDATED = "March 12, 2026";
const CONTACT = "support@neonchat.live";

export default function RefundPolicyPage() {
  return (
    <LegalShell title="Refund Policy" lastUpdated={UPDATED}>
      <section>
        <h2>1. Digital services &amp; platform credits</h2>
        <p>
          NeonLive provides <strong>digital content and software services</strong> for a digital
          content creator platform, including in-platform credits and optional feature unlocks. By
          default, these are <strong>delivered immediately</strong> upon successful payment through
          our payment processor, <strong>Stripe</strong>.
        </p>
      </section>
      <section>
        <h2>2. Statutory withdrawal (EU/UK consumers)</h2>
        <p>
          If you are a consumer in the European Economic Area or United Kingdom, you generally have a
          right to withdraw from distance contracts within 14 days. However, where you have{" "}
          <strong>expressly consented to immediate delivery</strong> of digital content and{" "}
          <strong>acknowledged that you lose your right of withdrawal</strong> once delivery begins,
          that right may no longer apply after delivery has started—consistent with applicable
          consumer regulations (e.g. EU Directive 2011/83/EU as transposed nationally).
        </p>
        <p>
          At checkout, you should confirm any consent or acknowledgment presented for instant delivery
          of digital services.
        </p>
      </section>
      <section>
        <h2>3. When we may issue a refund</h2>
        <p>We may approve refunds or account adjustments, at our discretion, when:</p>
        <ul>
          <li>A technical failure on our side prevented delivery of purchased entitlements;</li>
          <li>You were charged in error or duplicated due to a processing bug;</li>
          <li>Required by applicable consumer law in your jurisdiction;</li>
          <li>We offer a goodwill resolution for exceptional cases (not guaranteed).</li>
        </ul>
      </section>
      <section>
        <h2>4. When we typically do not refund</h2>
        <ul>
          <li>Change of mind after credits or features have been credited or activated;</li>
          <li>Violations of our Terms leading to suspension or termination;</li>
          <li>Issues caused by third parties outside our control (e.g. your bank or device), except as required by law.</li>
        </ul>
      </section>
      <section>
        <h2>5. Subscriptions (if applicable)</h2>
        <p>
          If we offer recurring subscriptions in the future, cancellation will stop future renewals; past
          billing periods are generally non-refundable unless stated otherwise or required by law.
          This policy will be updated to describe subscription terms clearly.
        </p>
      </section>
      <section>
        <h2>6. How to request a refund</h2>
        <p>
          Email{" "}
          <a href={`mailto:${CONTACT}`} className="text-violet-400 underline">
            {CONTACT}
          </a>{" "}
          with your account email, approximate date of purchase, and Stripe receipt or session details if
          available. We aim to respond within <strong>5–10 business days</strong>. Approved refunds are
          processed back to the original payment method where possible, subject to Stripe and card
          network timelines.
        </p>
      </section>
      <section>
        <h2>7. Chargebacks</h2>
        <p>
          Please contact us before initiating a chargeback so we can resolve the issue. Unfounded
          chargebacks may result in account restrictions.
        </p>
      </section>
      <section>
        <h2>8. Contact</h2>
        <p>
          <a href={`mailto:${CONTACT}`} className="text-violet-400 underline">
            {CONTACT}
          </a>
        </p>
      </section>
    </LegalShell>
  );
}
