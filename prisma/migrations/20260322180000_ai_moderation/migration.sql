-- AI moderation: user flags, moderation audit log, report AI priority
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bannedUntil" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "warnings" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "autoFlagged" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "aiPriority" TEXT;

CREATE TABLE IF NOT EXISTS "ModerationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ModerationLog_userId_idx" ON "ModerationLog"("userId");
CREATE INDEX IF NOT EXISTS "ModerationLog_severity_idx" ON "ModerationLog"("severity");
CREATE INDEX IF NOT EXISTS "ModerationLog_action_idx" ON "ModerationLog"("action");
CREATE INDEX IF NOT EXISTS "ModerationLog_createdAt_idx" ON "ModerationLog"("createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ModerationLog_userId_fkey'
  ) THEN
    ALTER TABLE "ModerationLog" ADD CONSTRAINT "ModerationLog_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
