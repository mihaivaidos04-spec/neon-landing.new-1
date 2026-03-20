import { auth } from "@/src/auth";
import { getUserAnalytics } from "@/src/lib/creator-analytics";
import StudioOverview from "@/src/components/studio/StudioOverview";
import SmartGoal from "@/src/components/studio/SmartGoal";
import ReportDownloadButton from "@/src/components/studio/ReportDownloadButton";
import StudioPageHeader from "@/src/components/studio/StudioPageHeader";

export const revalidate = 60;

export default async function StudioPage() {
  const session = await auth();
  const userId = (session as { userId?: string })?.userId ?? (session?.user as { id?: string })?.id;
  if (!userId) return null;

  const analytics = await getUserAnalytics(userId);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <StudioPageHeader />
        <ReportDownloadButton />
      </div>
      <SmartGoal userId={userId} />
      <StudioOverview analytics={analytics} />
    </div>
  );
}
