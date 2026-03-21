import type { PrismaClient } from "@prisma/client";

/** Match SQL helper `cleanup_expired_chat_messages` and cron job interval semantics. */
export const GLOBAL_PULSE_CHAT_TTL_MS = 5 * 60 * 1000;

/**
 * Deletes ChatMessage rows with createdAt older than TTL. Returns removed ids for Socket.io sync.
 */
export async function purgeExpiredGlobalPulseChatMessages(
  prisma: PrismaClient
): Promise<{ ids: string[] }> {
  const cutoff = new Date(Date.now() - GLOBAL_PULSE_CHAT_TTL_MS);
  const stale = await prisma.chatMessage.findMany({
    where: { createdAt: { lt: cutoff } },
    select: { id: true },
  });
  if (stale.length === 0) return { ids: [] };
  const ids = stale.map((r) => r.id);
  await prisma.chatMessage.deleteMany({ where: { id: { in: ids } } });
  return { ids };
}
