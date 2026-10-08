import { createHash, randomBytes, timingSafeEqual } from "crypto";

/**
 * Password-reset links reuse the user's one-time-code fields (emailOtp /
 * emailOtpExpiry). A reset entry is stored as "reset:<sha256 of the token>",
 * so it can never be mistaken for an email-verification code, and vice versa.
 * The token is 256 random bits, so unlike a 6-digit code it can't be guessed.
 */
export const RESET_PREFIX = "reset:";
export const RESET_TTL_MS = 30 * 60 * 1000;
export const RESET_COOLDOWN_MS = 60 * 1000;
export const MIN_PASSWORD_LENGTH = 8;

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/** A new token to email, and what to store for it. */
export function createResetToken() {
  const token = randomBytes(32).toString("hex");
  return { token, stored: RESET_PREFIX + sha256(token) };
}

/** Whether a stored entry is a live reset for this token. */
export function resetTokenMatches(stored: string | null, expiry: Date | null, token: string) {
  if (!stored?.startsWith(RESET_PREFIX) || !expiry || expiry.getTime() < Date.now()) return false;
  if (typeof token !== "string" || !/^[0-9a-f]{64}$/.test(token)) return false;
  const expected = Buffer.from(stored.slice(RESET_PREFIX.length), "hex");
  const actual = Buffer.from(sha256(token), "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
