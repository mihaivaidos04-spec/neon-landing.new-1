import { redirect } from "next/navigation";

/** Canonical editable profile lives at `/profile/me`. Preserves query string (e.g. Stripe success). */
export default async function ProfileIndexPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string") qs.set(k, v);
  }
  const tail = qs.toString() ? `?${qs.toString()}` : "";
  redirect(`/profile/me${tail}`);
}
