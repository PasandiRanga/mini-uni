import crypto from "crypto";
import { Prisma } from "@prisma/client";
import prisma from "./prisma";
import { completeTopUp, creditBookingToWallet, failTopUp } from "./wallet";
import { createNotification } from "./notifications";

/**
 * PayHere
 * -------
 * Money comes in through PayHere's hosted checkout. The browser only ever
 * receives a signed payment object — the merchant secret never leaves the
 * server, and nothing is marked paid on the strength of a client call.
 *
 * The truth about a payment is PayHere's server-to-server notification, which
 * carries an md5 signature we can check. `applyPayHereResult` is the single
 * place a payment is fulfilled, and it is safe to run twice.
 */

export const PAYHERE_MERCHANT_ID = process.env.PAYHERE_MERCHANT_ID || "";
const PAYHERE_MERCHANT_SECRET = process.env.PAYHERE_MERCHANT_SECRET || "";

/** Sandbox unless explicitly switched off, so a missing env can't charge cards. */
export const PAYHERE_SANDBOX = process.env.PAYHERE_SANDBOX !== "false";

/**
 * Whether the sandbox confirm route is open. PayHere can't call a notify_url on
 * localhost, so local development needs a way to settle a sandbox payment —
 * see /api/payments/payhere/confirm/[orderId]. Off unless both flags are set.
 */
export const PAYHERE_LOCAL_CONFIRM =
  PAYHERE_SANDBOX && process.env.PAYHERE_ALLOW_LOCAL_CONFIRM === "true";

export const PAYHERE_CHECKOUT_URL = PAYHERE_SANDBOX
  ? "https://sandbox.payhere.lk/pay/checkout"
  : "https://www.payhere.lk/pay/checkout";

/** PayHere only settles in these; everything else has to be converted first. */
export const PAYHERE_CURRENCIES = ["LKR", "USD", "GBP", "EUR", "AUD"];

const md5 = (value: string) => crypto.createHash("md5").update(value).digest("hex");

const hashedSecret = () => md5(PAYHERE_MERCHANT_SECRET).toUpperCase();

export const isPayHereConfigured = () => Boolean(PAYHERE_MERCHANT_ID && PAYHERE_MERCHANT_SECRET);

/** PayHere wants a plain two-decimal amount — no thousands separators. */
export const payhereAmount = (amount: Prisma.Decimal | number | string) =>
  Number(amount).toFixed(2);

/**
 * Signature that proves a checkout came from us:
 *   upper(md5(merchant_id + order_id + amount + currency + upper(md5(secret))))
 */
export const checkoutHash = (orderId: string, amount: Prisma.Decimal | number | string, currency: string) =>
  md5(PAYHERE_MERCHANT_ID + orderId + payhereAmount(amount) + currency + hashedSecret()).toUpperCase();

/* Order ids carry what the payment was for, so a notification can be routed
 * without trusting anything the browser sent back. */
export type PayHerePurpose = "BOOKING" | "TOPUP";

const PREFIX: Record<PayHerePurpose, string> = { BOOKING: "CLS", TOPUP: "TOP" };

export const buildOrderId = (purpose: PayHerePurpose, recordId: string) =>
  `${PREFIX[purpose]}-${recordId}`;

export const parseOrderId = (orderId: string): { purpose: PayHerePurpose; recordId: string } | null => {
  const [prefix, ...rest] = (orderId || "").split("-");
  const recordId = rest.join("-");
  if (!recordId) return null;
  if (prefix === PREFIX.BOOKING) return { purpose: "BOOKING", recordId };
  if (prefix === PREFIX.TOPUP) return { purpose: "TOPUP", recordId };
  return null;
};

export interface PayHereNotification {
  merchant_id: string;
  order_id: string;
  payment_id?: string;
  payhere_amount: string;
  payhere_currency: string;
  status_code: string;
  md5sig: string;
  method?: string;
  status_message?: string;
}

/**
 * Checks a notification really came from PayHere:
 *   upper(md5(merchant_id + order_id + amount + currency + status_code + upper(md5(secret))))
 */
export function verifyNotification(n: PayHereNotification) {
  if (!isPayHereConfigured()) return false;
  if (n.merchant_id !== PAYHERE_MERCHANT_ID) return false;

  const expected = md5(
    n.merchant_id + n.order_id + n.payhere_amount + n.payhere_currency + n.status_code + hashedSecret()
  ).toUpperCase();

  return expected === (n.md5sig || "").toUpperCase();
}

/** PayHere's status codes. Only 2 means the money actually arrived. */
export const PAYHERE_STATUS = {
  SUCCESS: "2",
  PENDING: "0",
  CANCELLED: "-1",
  FAILED: "-2",
  CHARGEDBACK: "-3",
} as const;

interface CheckoutPayer {
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  phone?: string | null;
}

interface CheckoutInput {
  orderId: string;
  amount: Prisma.Decimal | number | string;
  currency: string;
  items: string;
  payer: CheckoutPayer;
  origin: string;
  returnPath: string;
  cancelPath: string;
}

/**
 * The object the browser hands to `payhere.startPayment`. Built server-side
 * because the hash depends on the merchant secret.
 */
export function buildCheckout({
  orderId,
  amount,
  currency,
  items,
  payer,
  origin,
  returnPath,
  cancelPath,
}: CheckoutInput) {
  return {
    sandbox: PAYHERE_SANDBOX,
    merchant_id: PAYHERE_MERCHANT_ID,
    return_url: `${origin}${returnPath}`,
    cancel_url: `${origin}${cancelPath}`,
    notify_url: `${origin}/api/payments/payhere/notify`,
    order_id: orderId,
    items,
    amount: payhereAmount(amount),
    currency,
    hash: checkoutHash(orderId, amount, currency),
    first_name: payer.firstName || "",
    last_name: payer.lastName || "",
    email: payer.email,
    phone: payer.phone || "",
    // PayHere requires these, but a class is not shipped anywhere.
    address: "N/A",
    city: "Colombo",
    country: "Sri Lanka",
  };
}

/**
 * Applies a verified payment result. Called by the notification handler — and
 * by the sandbox-only confirm route — so both take exactly the same path.
 * Every step underneath is idempotent, so replays are harmless.
 */
export async function applyPayHereResult(params: {
  orderId: string;
  statusCode: string;
  paymentId?: string | null;
  method?: string | null;
}) {
  const parsed = parseOrderId(params.orderId);
  if (!parsed) return { handled: false, reason: "UNKNOWN_ORDER" as const };

  const succeeded = params.statusCode === PAYHERE_STATUS.SUCCESS;
  const abandoned =
    params.statusCode === PAYHERE_STATUS.CANCELLED || params.statusCode === PAYHERE_STATUS.FAILED;

  if (parsed.purpose === "TOPUP") {
    if (succeeded) {
      const result = await completeTopUp(parsed.recordId, params.paymentId ?? undefined);
      return { handled: true, purpose: parsed.purpose, ...result };
    }
    if (abandoned) {
      await failTopUp(parsed.recordId);
      return { handled: true, purpose: parsed.purpose, credited: false };
    }
    return { handled: true, purpose: parsed.purpose, credited: false }; // still pending
  }

  const payment = await prisma.payment.findUnique({ where: { id: parsed.recordId } });
  if (!payment) return { handled: false, reason: "UNKNOWN_ORDER" as const };

  if (!succeeded) {
    if (abandoned && payment.status === "PENDING") {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    }
    return { handled: true, purpose: parsed.purpose, paid: false };
  }

  if (payment.status !== "COMPLETED") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "COMPLETED",
        gatewayPaymentId: params.paymentId ?? payment.gatewayPaymentId,
        metadata: { gateway: "PAYHERE", method: params.method ?? null },
      },
    });
    const booking = await prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: "CONFIRMED" },
    });

    // First-time completion only (guarded by the status check above), so a
    // repeated gateway notification won't re-notify.
    await createNotification({
      userId: booking.studentId,
      type: "PAYMENT_SUCCESS",
      title: "Payment successful",
      message: "Your payment went through and your class is confirmed.",
      metadata: { bookingId: booking.id },
    });
    await createNotification({
      userId: booking.teacherId,
      type: "BOOKING_CONFIRMED",
      title: "New booking confirmed",
      message: "A student paid for a class — it's now confirmed on your schedule.",
      metadata: { bookingId: booking.id },
    });
  }

  // Hold the money in the teacher's wallet until the class is over.
  await creditBookingToWallet(payment.bookingId);

  return { handled: true, purpose: parsed.purpose, paid: true };
}
