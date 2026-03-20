import { auth } from "@/src/auth";
import { getUserAnalytics } from "@/src/lib/creator-analytics";
import AudienceMap from "@/src/components/studio/AudienceMap";

export const revalidate = 60;

const COUNTRY_NAMES: Record<string, string> = {
  SA: "Saudi Arabia",
  ID: "Indonesia",
  US: "United States",
  IN: "India",
  RO: "Romania",
  DE: "Germany",
  GB: "United Kingdom",
  AE: "UAE",
  EG: "Egypt",
  MY: "Malaysia",
  Unknown: "Unknown",
};

export default async function StudioAudiencePage() {
  const session = await auth();
  const userId = (session as { userId?: string })?.userId ?? (session?.user as { id?: string })?.id;
  if (!userId) return null;

  const analytics = await getUserAnalytics(userId);
  const countries = analytics.topCountries.map((c) => ({
    ...c,
    name: COUNTRY_NAMES[c.country] ?? c.country,
  }));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Audience Map</h1>
      <AudienceMap countries={countries} />
    </div>
  );
}
