-- Future arcade / mini-games fields on User
ALTER TABLE "User" ADD COLUMN "highScore" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "arcadeTokens" INTEGER NOT NULL DEFAULT 0;
