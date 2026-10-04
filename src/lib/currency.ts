// Supported account/transaction currencies. LKR is the platform default.
export const CURRENCIES = ["LKR", "USD"] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

export const DEFAULT_CURRENCY: CurrencyCode = "LKR";

const CURRENCY_META: Record<CurrencyCode, { locale: string; label: string }> = {
  LKR: { locale: "en-LK", label: "Sri Lankan Rupee (Rs)" },
  USD: { locale: "en-US", label: "US Dollar ($)" },
};

const normalize = (currency?: string): CurrencyCode =>
  currency && (CURRENCIES as readonly string[]).includes(currency) ? (currency as CurrencyCode) : DEFAULT_CURRENCY;

/**
 * Formats a monetary amount with thousands separators, two decimals, and the
 * correct currency symbol. Accepts number | string | Prisma Decimal (which
 * serializes to string over JSON).
 *
 * formatMoney(1250, "LKR")  -> "Rs 1,250.00"
 * formatMoney("40.5", "USD") -> "$40.50"
 */
export function formatMoney(amount: number | string | null | undefined, currency?: string): string {
  const code = normalize(currency);
  const value = typeof amount === "string" ? parseFloat(amount) : amount ?? 0;
  const safe = Number.isFinite(value as number) ? (value as number) : 0;

  return new Intl.NumberFormat(CURRENCY_META[code].locale, {
    style: "currency",
    currency: code,
    currencyDisplay: code === "LKR" ? "narrowSymbol" : "symbol",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);
}

/**
 * Like formatMoney, but drops the cents on whole amounts. Used for headline
 * figures (stat tiles, wallet totals) where "Rs 12,500" reads better than
 * "Rs 12,500.00" and fits the space.
 */
export function formatMoneyCompact(amount: number | string | null | undefined, currency?: string): string {
  const code = normalize(currency);
  const value = typeof amount === "string" ? parseFloat(amount) : amount ?? 0;
  const safe = Number.isFinite(value as number) ? (value as number) : 0;
  const whole = Number.isInteger(Math.round(safe * 100) / 100);

  return new Intl.NumberFormat(CURRENCY_META[code].locale, {
    style: "currency",
    currency: code,
    currencyDisplay: code === "LKR" ? "narrowSymbol" : "symbol",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(safe);
}

/** Human-readable label for a currency, used in the settings selector. */
export function currencyLabel(currency?: string): string {
  return CURRENCY_META[normalize(currency)].label;
}
