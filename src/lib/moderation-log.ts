import type { PrismaClient } from "@prisma/client";

export type ModerationAction = "blocked" | "warned" | "banned";

export async function recordModerationLog(
  db: PrismaClient,
  params: {
    userId: string;
    content: string;
    reason: string;
    severity: string;
    action: ModerationAction;
  }
): Promise<void> {
  const content = params.content.length > 8000 ? params.content.slice(0, 8000) : params.content;
  await db.moderationLog.create({
    data: {
      userId: params.userId,
      content,
      reason: params.reason.slice(0, 500),
      severity: params.severity.slice(0, 32),
      action: params.action,
    },
  });
}
