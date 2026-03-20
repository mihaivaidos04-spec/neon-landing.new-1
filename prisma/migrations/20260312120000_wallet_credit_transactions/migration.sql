-- CreateTable
CREATE TABLE "wallet_credit_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'stripe',
    "stripeSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_credit_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wallet_credit_transactions_stripeSessionId_key" ON "wallet_credit_transactions"("stripeSessionId");

-- CreateIndex
CREATE INDEX "wallet_credit_transactions_userId_idx" ON "wallet_credit_transactions"("userId");

-- CreateIndex
CREATE INDEX "wallet_credit_transactions_createdAt_idx" ON "wallet_credit_transactions"("createdAt");

-- AddForeignKey
ALTER TABLE "wallet_credit_transactions" ADD CONSTRAINT "wallet_credit_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
