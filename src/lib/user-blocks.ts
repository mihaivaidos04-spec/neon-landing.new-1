import { prisma } from "./prisma";

/**
 * User IDs that must not be paired with `userId` in matching (either direction).
 */
export async function getMatchingExcludedUserIds(userId: string): Promise<Set<string>> {
  const [outgoing, incoming] = await Promise.all([
    prisma.userBlock.findMany({
      where: { blockerId: userId },
      select: { blockedId: true },
    }),
    prisma.userBlock.findMany({
      where: { blockedId: userId },
      select: { blockerId: true },
    }),
  ]);
  const set = new Set<string>();
  for (const r of outgoing) set.add(r.blockedId);
  for (const r of incoming) set.add(r.blockerId);
  return set;
}

export async function pairingAllowed(userA: string, userB: string): Promise<boolean> {
  const [exA, exB] = await Promise.all([
    getMatchingExcludedUserIds(userA),
    getMatchingExcludedUserIds(userB),
  ]);
  if (exA.has(userB) || exB.has(userA)) return false;
  return true;
}
