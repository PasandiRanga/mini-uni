-- Dispute evidence: students can attach files (images, PDFs, screen recordings)
-- when reporting a problem. The files live in Vercel Blob; we store their URLs.
-- Run this in the Neon SQL console before deploying.

ALTER TABLE "disputes"
  ADD COLUMN IF NOT EXISTS "evidenceUrls" TEXT[] NOT NULL DEFAULT '{}';
