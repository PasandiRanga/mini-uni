-- No-show settlement: absence fees and penalties.
--
-- Run this in the Neon SQL console BEFORE deploying the no-show changes.
-- Postgres requires each new enum value to be committed before it's used, so
-- run the ALTER TYPE statements first (they auto-commit), then the table changes.

-- 1) New wallet transaction types.
ALTER TYPE "WalletTransactionType" ADD VALUE IF NOT EXISTS 'ABSENCE_FEE';
ALTER TYPE "WalletTransactionType" ADD VALUE IF NOT EXISTS 'PENALTY';

-- 2) Booking fields that record the no-show outcome.
ALTER TABLE "bookings"
  ADD COLUMN IF NOT EXISTS "teacherMarkedAbsent" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "settlementOutcome" TEXT;
