-- Google sign-in: accounts created via Google have no password.
-- Run this in the Neon SQL console before deploying Google login.

ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;
