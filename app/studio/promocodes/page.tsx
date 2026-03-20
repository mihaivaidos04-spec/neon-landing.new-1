import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import PromocodesView from "@/src/components/studio/PromocodesView";

export const revalidate = 30;

export default async function StudioPromocodesPage() {
  const session = await auth();
  const userId = (session as { userId?: string })?.userId ?? (session?.user as { id?: string })?.id;
  if (!userId) return null;

  const promocodes = await prisma.promocode.findMany({
    where: { creatorId: userId },
    orderBy: { createdAt: "desc" },
  });

  const serialized = promocodes.map((p) => ({
    id: p.id,
    code: p.code,
    bonusPercent: p.bonusPercent,
    usedCount: p.usedCount,
    createdAt: p.createdAt.toISOString(),
  }));

  return <PromocodesView promocodes={serialized} />;
}
