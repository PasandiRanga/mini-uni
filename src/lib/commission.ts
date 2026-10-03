import { Prisma } from "@prisma/client";

/** Platform cut, as a percentage, used when PLATFORM_COMMISSION_PERCENT is unset. */
export const DEFAULT_COMMISSION_PERCENT = 10;

/**
 * The platform's cut of each class, as a percentage (10 = 10%). Read from
 * PLATFORM_COMMISSION_PERCENT so the rate can change without a deploy; anything
 * missing or outside 0–100 falls back to the default.
 */
export function commissionPercent(): number {
  const raw = process.env.PLATFORM_COMMISSION_PERCENT;
  const value = raw === undefined || raw.trim() === "" ? NaN : Number(raw);
  return Number.isFinite(value) && value >= 0 && value <= 100 ? value : DEFAULT_COMMISSION_PERCENT;
}

/**
 * Splits a class fee into the platform's commission and the teacher's share.
 * The commission is rounded to the cent and the teacher gets the rest, so the
 * two always add back up to the gross amount exactly.
 */
export function splitCommission(gross: Prisma.Decimal.Value, percent = commissionPercent()) {
  const amount = new Prisma.Decimal(gross);
  const fee = amount
    .mul(percent)
    .div(100)
    .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
  return { gross: amount, fee, net: amount.sub(fee), percent };
}
