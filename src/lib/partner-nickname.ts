import { prisma } from "./prisma";

export async function getPartnerNickname(partnerId: string): Promise<string | null> {
  const u = await prisma.user.findUnique({
    where: { id: partnerId },
    select: { nickname: true },
  });
  return u?.nickname ?? null;
}
