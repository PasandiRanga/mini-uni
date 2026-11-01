-- Manual migration for the slip-based wallet top-up flow.
-- Run this in Neon (against the production branch) BEFORE deploying the code
-- that uses it. There are no Prisma migrations in this project — schema changes
-- are applied by hand.
--
-- 1) Column to hold the uploaded bank-deposit slip on a manual TOP_UP.
ALTER TABLE "wallet_transactions"
  ADD COLUMN IF NOT EXISTS "slipUrl" TEXT;

-- 2) Notification types for the admin alert and the student's approve/reject.
--    ALTER TYPE ... ADD VALUE cannot run inside a transaction block; run each on its own.
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'TOPUP_SUBMITTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'TOPUP_REVIEWED';
