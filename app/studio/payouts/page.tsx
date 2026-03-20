import { auth } from "@/src/auth";
import { getUserAnalytics } from "@/src/lib/creator-analytics";
import { prisma } from "@/src/lib/prisma";
import PayoutsView from "@/src/components/studio/PayoutsView";

export const revalidate = 30;

const MIN_PAYOUT_EUR = 50;

export default async function StudioPayoutsPage() {
  const session = await auth();
  const userId = (session as { userId?: string })?.userId ?? (session?.user as { id?: string })?.id;
  if (!userId) return null;

  const analytics = await getUserAnalytics(userId);
  const payouts = await prisma.creatorPayout.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const totalPaidOut = payouts.reduce((s, p) => s + Number(p.amountEur), 0);
  const pendingBalance = Math.max(0, analytics.netRevenue - totalPaidOut);

  return (
    <PayoutsView
      pendingBalance={pendingBalance}
      canRequestPayout={pendingBalance >= MIN_PAYOUT_EUR}
      minPayout={MIN_PAYOUT_EUR}
      payouts={payouts.map((p) => ({
        id: p.id,
        amountEur: Number(p.amountEur),
        status: p.status,
        paidAt: p.paidAt?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
      }))}
    />
  );
}
