-- Rename streak counter on User (was streakCount)
ALTER TABLE "User" RENAME COLUMN "streakCount" TO "currentStreak";

ALTER TABLE "User" ADD COLUMN "streakBonusPopup" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "isVip" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "animatedBanner" TEXT;
ALTER TABLE "User" ADD COLUMN "profileGifUrl" TEXT;
ALTER TABLE "User" ADD COLUMN "profileBannerEffect" TEXT;

ALTER TABLE "ChatMessage" ADD COLUMN "neonVip" BOOLEAN NOT NULL DEFAULT false;

-- Optional backfill: whale pack purchasers
UPDATE "User" u
SET "isVip" = true
FROM "StripePurchase" sp
WHERE sp."userId" = u.id AND sp."packId" = 'whale' AND sp.status = 'completed';
