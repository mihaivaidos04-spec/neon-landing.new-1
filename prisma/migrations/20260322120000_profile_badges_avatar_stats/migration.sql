-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "socialTwitter" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "totalMatches" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "totalOnlineMinutes" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profileHeartbeatAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE IF NOT EXISTS "badges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "badges_userId_type_key" ON "badges"("userId", "type");
CREATE INDEX IF NOT EXISTS "badges_userId_idx" ON "badges"("userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'badges_userId_fkey'
  ) THEN
    ALTER TABLE "badges" ADD CONSTRAINT "badges_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
