-- Student-request offers: a teacher's reply proposes a rate + time, and the
-- student's acceptance charges them and books the class (escrow hold + Meet).
-- Run this in the Neon SQL console before deploying.

ALTER TABLE "inquiries"
  ADD COLUMN IF NOT EXISTS "proposedRate" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "proposedStartTime" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "proposedEndTime" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "proposedFee" DECIMAL(10,2);
