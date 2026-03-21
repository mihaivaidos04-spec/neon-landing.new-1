import type { PrismaClient } from "@prisma/client";

/** Accepted friendship between two users (either direction). */
export async function areFriends(
  prisma: PrismaClient,
  userIdA: string,
  userIdB: string
): Promise<boolean> {
  if (userIdA === userIdB) return false;
  const row = await prisma.friendship.findFirst({
    where: {
      status: "accepted",
      OR: [
        { requesterId: userIdA, addresseeId: userIdB },
        { requesterId: userIdB, addresseeId: userIdA },
      ],
    },
    select: { id: true },
  });
  return Boolean(row);
}
