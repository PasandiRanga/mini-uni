-- Manual migration for the teacher Google Calendar / Meet integration.
-- Run this in Neon BEFORE deploying the code that uses it. Additive and safe.
--
-- Stores a teacher's Google OAuth refresh token so booked classes can be put on
-- their calendar with a Meet link. One row per user.
CREATE TABLE IF NOT EXISTS "google_accounts" (
  "id"           TEXT NOT NULL,
  "userId"       TEXT NOT NULL,
  "email"        TEXT,
  "refreshToken" TEXT NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "google_accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "google_accounts_userId_key" ON "google_accounts"("userId");

ALTER TABLE "google_accounts"
  ADD CONSTRAINT "google_accounts_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
