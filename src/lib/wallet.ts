import { Prisma, WithdrawalStatus } from "@prisma/client";
import prisma from "./prisma";
import { createNotification } from "./notifications";
import { splitCommission, commissionPercent } from "./commission";

/**
 * Escrow model
 * ------------
 * A student's payment lands in the teacher's wallet as *pending* money. It
 * clears into the *released* (withdrawable) balance once the class is over —
 * that is, once the booked time slot's end time has passed, or earlier if both
 * sides confirm the class is complete. Only released money can be withdrawn.
 *
 * Students have a wallet too. Theirs holds spendable money rather than
 * earnings: refunds from cancelled classes land there, students can top it up
 * by card, and the balance can be spent on a class instead of paying by card.
 * Both roles share `releasedBalance` — for a teacher it is what they can
 * withdraw, for a student it is what they can spend.
 */

/** Smallest amount a teacher can request in one withdrawal, per currency. */
export const MIN_WITHDRAWAL: Record<string, number> = { LKR: 1000, USD: 5 };

export const minWithdrawal = (currency?: string) => MIN_WITHDRAWAL[currency || "LKR"] ?? MIN_WITHDRAWAL.LKR;

/** Bookings whose money is real: paid for and not cancelled. */
const FUNDED_BOOKING_STATUSES: Prisma.EnumBookingStatusFilter = {
  notIn: ["PENDING_PAYMENT", "CANCELLED"],
};

const isUniqueViolation = (err: unknown) =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";

export async function getWalletForUser(userId: string) {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (wallet) return wallet;

  try {
    return await prisma.wallet.create({ data: { userId } });
  } catch (err) {
    // Two concurrent requests can both miss the lookup; the loser re-reads.
    if (isUniqueViolation(err)) return prisma.wallet.findUniqueOrThrow({ where: { userId } });
    throw err;
  }
}

/**
 * Credits a paid booking into the teacher's pending balance. Safe to call more
 * than once for the same booking — the DEPOSIT entry is unique per booking, so
 * a repeat call is a no-op.
 */
export async function creditBookingToWallet(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true },
  });
  if (!booking) throw new Error("Booking not found");

  const amount = new Prisma.Decimal(booking.payment?.amount ?? booking.fee);
  const wallet = await getWalletForUser(booking.teacherId);

  try {
    await prisma.$transaction([
      prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          bookingId: booking.id,
          type: "DEPOSIT",
          amount,
          status: "COMPLETED",
          description: "Payment received — held until the class is over",
        },
      }),
      prisma.wallet.update({
        where: { id: wallet.id },
        data: { pendingBalance: { increment: amount } },
      }),
    ]);
    return { credited: true };
  } catch (err) {
    if (isUniqueViolation(err)) return { credited: false }; // already credited
    throw err;
  }
}

/**
 * Moves one booking's escrow from pending to released, keeping the platform's
 * commission back. The full amount leaves pending; the teacher's share lands in
 * the released balance, and the fee is recorded as its own COMMISSION entry so
 * the ledger shows gross, fee and net. Idempotent for the same reason as the
 * deposit above.
 */
export async function releaseBookingEscrow(bookingId: string) {
  const deposit = await prisma.walletTransaction.findFirst({
    where: { bookingId, type: "DEPOSIT" },
  });
  // Nothing was ever escrowed for this booking (unpaid, or paid outside the wallet).
  if (!deposit || deposit.status !== "COMPLETED") return { released: false };

  const { fee, net, percent } = splitCommission(deposit.amount);

  try {
    await prisma.$transaction([
      prisma.walletTransaction.create({
        data: {
          walletId: deposit.walletId,
          bookingId,
          type: "RELEASE",
          amount: deposit.amount,
          status: "COMPLETED",
          description: "Class completed — earnings available to withdraw",
        },
      }),
      ...(fee.gt(0)
        ? [
            prisma.walletTransaction.create({
              data: {
                walletId: deposit.walletId,
                bookingId,
                type: "COMMISSION",
                amount: fee,
                status: "COMPLETED",
                description: `MiniUni service fee (${percent}%)`,
              },
            }),
          ]
        : []),
      prisma.wallet.update({
        where: { id: deposit.walletId },
        data: {
          pendingBalance: { decrement: deposit.amount },
          releasedBalance: { increment: net },
          totalEarnings: { increment: net },
        },
      }),
    ]);
    return { released: true, fee, net };
  } catch (err) {
    if (isUniqueViolation(err)) return { released: false }; // already released
    throw err;
  }
}

/**
 * Releases every booking of this teacher whose class has finished but whose
 * money is still on hold. Called whenever the wallet is read, which keeps
 * balances correct without a background job.
 */
export async function releaseDueEscrow(userId: string) {
  const due = await prisma.booking.findMany({
    where: {
      teacherId: userId,
      status: FUNDED_BOOKING_STATUSES,
      timeSlot: { endTime: { lte: new Date() } },
      walletTransactions: {
        some: { type: "DEPOSIT", status: "COMPLETED" },
        none: { type: "RELEASE" },
      },
    },
    select: { id: true },
  });

  let released = 0;
  for (const b of due) {
    const res = await releaseBookingEscrow(b.id);
    if (res.released) released += 1;
  }
  return released;
}

/** Bookings still on hold, with the moment each one clears. */
export async function getPendingHolds(userId: string) {
  const holds = await prisma.booking.findMany({
    where: {
      teacherId: userId,
      status: FUNDED_BOOKING_STATUSES,
      walletTransactions: {
        some: { type: "DEPOSIT", status: "COMPLETED" },
        none: { type: "RELEASE" },
      },
    },
    select: {
      id: true,
      fee: true,
      timeSlot: { select: { startTime: true, endTime: true } },
      student: { select: { firstName: true, lastName: true } },
      inquiry: { select: { post: { select: { title: true, subject: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return holds.map((h) => ({
    bookingId: h.id,
    amount: h.fee,
    // What the teacher will actually receive once the platform fee comes off.
    netAmount: splitCommission(h.fee).net,
    releasesAt: h.timeSlot?.endTime ?? null,
    startTime: h.timeSlot?.startTime ?? null,
    title: h.inquiry?.post?.title || h.inquiry?.post?.subject || "Class",
    studentName: `${h.student?.firstName ?? ""} ${h.student?.lastName ?? ""}`.trim(),
  }));
}

/**
 * Debits the released balance and records a withdrawal request. The debit is
 * guarded by the balance itself, so two requests racing for the same money can
 * never overdraw the wallet — the second one finds nothing to take.
 */
export async function requestWithdrawal(userId: string, amount: Prisma.Decimal, currency: string) {
  const wallet = await getWalletForUser(userId);

  const profile = await prisma.teacherProfile.findUnique({
    where: { userId },
    select: { bankAccountName: true, bankAccountNumber: true, bankName: true, bankBranch: true },
  });

  return prisma.$transaction(async (tx) => {
    const debited = await tx.wallet.updateMany({
      where: { id: wallet.id, releasedBalance: { gte: amount } },
      data: { releasedBalance: { decrement: amount } },
    });
    if (debited.count === 0) throw new Error("INSUFFICIENT_FUNDS");

    const transaction = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "WITHDRAWAL",
        amount,
        status: "PENDING",
        description: "Withdrawal requested",
      },
    });

    return tx.withdrawal.create({
      data: {
        walletId: wallet.id,
        transactionId: transaction.id,
        amount,
        currency,
        bankAccountName: profile?.bankAccountName ?? null,
        bankAccountNumber: profile?.bankAccountNumber ?? null,
        bankName: profile?.bankName ?? null,
        bankBranch: profile?.bankBranch ?? null,
      },
    });
  });
}

/** Cancels a still-pending withdrawal and puts the money back. */
export async function cancelWithdrawal(userId: string, withdrawalId: string) {
  const wallet = await getWalletForUser(userId);

  return prisma.$transaction(async (tx) => {
    // Scoped to this wallet, so one teacher can't cancel another's request.
    const cancelled = await tx.withdrawal.updateMany({
      where: { id: withdrawalId, walletId: wallet.id, status: "PENDING" },
      data: { status: "CANCELLED", processedAt: new Date(), note: "Cancelled by teacher" },
    });
    if (cancelled.count === 0) throw new Error("NOT_CANCELLABLE");

    const withdrawal = await tx.withdrawal.findUniqueOrThrow({ where: { id: withdrawalId } });

    await tx.walletTransaction.update({
      where: { id: withdrawal.transactionId },
      data: { status: "FAILED", description: "Withdrawal cancelled" },
    });

    await tx.wallet.update({
      where: { id: wallet.id },
      data: { releasedBalance: { increment: withdrawal.amount } },
    });

    return withdrawal;
  });
}

/* -------------------------------------------------------------------------- *
 * Admin — withdrawal payouts
 *
 * A teacher requests a withdrawal (see requestWithdrawal above), which debits
 * their released balance immediately and creates a PENDING request. An admin
 * then works the queue: PROCESSING while the bank transfer is in flight, PAID
 * once the money is sent, or REJECTED — which puts the debited money back.
 * -------------------------------------------------------------------------- */

/** Withdrawal requests awaiting admin action, newest first, with the teacher attached. */
export async function getWithdrawalsForAdmin(status?: string) {
  const where =
    status && status !== "ALL"
      ? { status: status as WithdrawalStatus }
      : {};

  const withdrawals = await prisma.withdrawal.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      wallet: {
        select: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      },
    },
  });

  return withdrawals.map((w) => ({
    id: w.id,
    amount: w.amount,
    currency: w.currency,
    status: w.status,
    bankAccountName: w.bankAccountName,
    bankAccountNumber: w.bankAccountNumber,
    bankName: w.bankName,
    bankBranch: w.bankBranch,
    reference: w.reference,
    note: w.note,
    processedAt: w.processedAt,
    createdAt: w.createdAt,
    teacher: w.wallet?.user
      ? {
          id: w.wallet.user.id,
          name: `${w.wallet.user.firstName ?? ""} ${w.wallet.user.lastName ?? ""}`.trim(),
          email: w.wallet.user.email,
        }
      : null,
  }));
}

/**
 * Moves a still-open withdrawal to PROCESSING — the payout has been started at
 * the bank but the money hasn't landed yet. Only a PENDING request can enter
 * processing.
 */
export async function markWithdrawalProcessing(withdrawalId: string) {
  const updated = await prisma.withdrawal.updateMany({
    where: { id: withdrawalId, status: "PENDING" },
    data: { status: "PROCESSING" },
  });
  if (updated.count === 0) throw new Error("NOT_ACTIONABLE");
  return prisma.withdrawal.findUniqueOrThrow({ where: { id: withdrawalId } });
}

/**
 * Marks a withdrawal PAID and settles its wallet entry. The money already left
 * the released balance when the request was made, so this only records the
 * payout — no balance change.
 */
export async function markWithdrawalPaid(withdrawalId: string, reference?: string) {
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.withdrawal.updateMany({
      where: { id: withdrawalId, status: { in: ["PENDING", "PROCESSING"] } },
      data: { status: "PAID", processedAt: new Date(), reference: reference || undefined },
    });
    if (claimed.count === 0) throw new Error("NOT_ACTIONABLE");

    const withdrawal = await tx.withdrawal.findUniqueOrThrow({ where: { id: withdrawalId } });

    await tx.walletTransaction.update({
      where: { id: withdrawal.transactionId },
      data: { status: "COMPLETED", description: "Withdrawal paid out", reference: reference || undefined },
    });

    return withdrawal;
  });
}

/**
 * Rejects an open withdrawal and returns the money to the teacher's released
 * balance — the mirror of cancelWithdrawal, but admin-initiated and with a
 * reason recorded.
 */
export async function rejectWithdrawal(withdrawalId: string, note: string) {
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.withdrawal.updateMany({
      where: { id: withdrawalId, status: { in: ["PENDING", "PROCESSING"] } },
      data: { status: "REJECTED", processedAt: new Date(), note },
    });
    if (claimed.count === 0) throw new Error("NOT_ACTIONABLE");

    const withdrawal = await tx.withdrawal.findUniqueOrThrow({ where: { id: withdrawalId } });

    await tx.walletTransaction.update({
      where: { id: withdrawal.transactionId },
      data: { status: "FAILED", description: "Withdrawal rejected — amount returned" },
    });

    await tx.wallet.update({
      where: { id: withdrawal.walletId },
      data: { releasedBalance: { increment: withdrawal.amount } },
    });

    return withdrawal;
  });
}

/**
 * Everything the wallet screen needs: balances, recent activity, money still on
 * hold, withdrawal history, and whether payouts are set up.
 */
export async function getWalletSnapshot(userId: string) {
  await releaseDueEscrow(userId);

  const wallet = await getWalletForUser(userId);

  const [transactions, withdrawals, holds, profile] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        booking: {
          select: {
            id: true,
            timeSlot: { select: { startTime: true } },
            student: { select: { firstName: true, lastName: true } },
            inquiry: { select: { post: { select: { title: true, subject: true } } } },
          },
        },
      },
    }),
    prisma.withdrawal.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    getPendingHolds(userId),
    prisma.teacherProfile.findUnique({
      where: { userId },
      select: { bankAccountName: true, bankAccountNumber: true, bankName: true, bankBranch: true },
    }),
  ]);

  const bankDetails = profile ?? null;
  const hasBankDetails = Boolean(
    bankDetails?.bankAccountName && bankDetails?.bankAccountNumber && bankDetails?.bankName
  );

  return {
    ...wallet,
    transactions: transactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      status: t.status,
      description: t.description,
      createdAt: t.createdAt,
      bookingId: t.bookingId,
      title: t.booking?.inquiry?.post?.title || t.booking?.inquiry?.post?.subject || null,
      studentName: t.booking
        ? `${t.booking.student?.firstName ?? ""} ${t.booking.student?.lastName ?? ""}`.trim()
        : null,
    })),
    withdrawals,
    holds,
    bankDetails,
    hasBankDetails,
    commissionPercent: commissionPercent(),
  };
}

/* -------------------------------------------------------------------------- *
 * Student wallet
 *
 * A student's wallet holds spendable money: refunds from cancelled classes and
 * card top-ups. It can be spent on a class instead of paying by card. There is
 * no escrow on this side — `releasedBalance` is simply the balance.
 * -------------------------------------------------------------------------- */

/** Smallest amount a student can add in one top-up, per currency. */
export const MIN_TOP_UP: Record<string, number> = { LKR: 500, USD: 2 };

export const minTopUp = (currency?: string) => MIN_TOP_UP[currency || "LKR"] ?? MIN_TOP_UP.LKR;

/**
 * Records a top-up the student has started but not paid for yet. Its id is the
 * order id the payment gateway is given, so a notification always points back
 * at exactly one transaction.
 */
export async function startTopUp(userId: string, amount: Prisma.Decimal) {
  const wallet = await getWalletForUser(userId);

  return prisma.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: "TOP_UP",
      amount,
      status: "PENDING",
      description: "Wallet top-up",
    },
  });
}

/**
 * Credits a paid top-up. Safe to call more than once — the gateway can and does
 * repeat notifications, and only the first call moves money.
 */
export async function completeTopUp(transactionId: string, gatewayPaymentId?: string) {
  const pending = await prisma.walletTransaction.findUnique({ where: { id: transactionId } });

  if (!pending || pending.type !== "TOP_UP") throw new Error("TOP_UP_NOT_FOUND");
  if (pending.status !== "PENDING") return { credited: false, amount: pending.amount };

  return prisma.$transaction(async (tx) => {
    // Claiming the row is what makes this a one-time credit: a second caller
    // finds nothing left in PENDING to claim.
    const claimed = await tx.walletTransaction.updateMany({
      where: { id: pending.id, status: "PENDING" },
      data: {
        status: "COMPLETED",
        description: "Added to wallet",
        reference: gatewayPaymentId ?? undefined,
      },
    });
    if (claimed.count === 0) return { credited: false, amount: pending.amount };

    await tx.wallet.update({
      where: { id: pending.walletId },
      data: { releasedBalance: { increment: pending.amount } },
    });

    return { credited: true, amount: pending.amount };
  });
}

/** Marks a top-up the student never paid for, so it stops showing as pending. */
export async function failTopUp(transactionId: string) {
  const updated = await prisma.walletTransaction.updateMany({
    where: { id: transactionId, status: "PENDING", type: "TOP_UP" },
    data: { status: "FAILED", description: "Top-up not completed" },
  });
  return { abandoned: updated.count > 0 };
}

/** Same, but only for the student who owns the top-up — used when they close the checkout. */
export async function abandonTopUp(transactionId: string, userId: string) {
  const pending = await prisma.walletTransaction.findUnique({
    where: { id: transactionId },
    include: { wallet: { select: { userId: true } } },
  });
  if (!pending || pending.wallet.userId !== userId) return { abandoned: false };

  return failTopUp(transactionId);
}

/**
 * Pays for a booking out of the student's wallet. The debit is guarded by the
 * balance itself, so a student can never spend money they don't have, and the
 * one-PAYMENT-per-booking rule stops a double click paying twice.
 *
 * The teacher's escrow is credited exactly as it would be for a card payment.
 */
export async function payBookingFromWallet(userId: string, bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true },
  });

  if (!booking) throw new Error("BOOKING_NOT_FOUND");
  if (booking.studentId !== userId) throw new Error("FORBIDDEN");
  if (booking.status === "CANCELLED") throw new Error("BOOKING_CANCELLED");
  if (booking.payment?.status === "COMPLETED") throw new Error("ALREADY_PAID");

  const amount = new Prisma.Decimal(booking.fee);
  const wallet = await getWalletForUser(userId);
  const student = await prisma.user.findUnique({
    where: { id: userId },
    select: { currency: true },
  });
  const currency = student?.currency || "LKR";

  try {
    await prisma.$transaction(async (tx) => {
      const debited = await tx.wallet.updateMany({
        where: { id: wallet.id, releasedBalance: { gte: amount } },
        data: {
          releasedBalance: { decrement: amount },
          totalSpent: { increment: amount },
        },
      });
      if (debited.count === 0) throw new Error("INSUFFICIENT_FUNDS");

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          bookingId: booking.id,
          type: "PAYMENT",
          amount,
          status: "COMPLETED",
          description: "Paid for a class from wallet",
        },
      });

      await tx.payment.upsert({
        where: { bookingId: booking.id },
        create: {
          bookingId: booking.id,
          amount,
          currency,
          status: "COMPLETED",
          metadata: { gateway: "WALLET" },
        },
        update: {
          amount,
          currency,
          status: "COMPLETED",
          metadata: { gateway: "WALLET" },
        },
      });

      await tx.booking.update({
        where: { id: booking.id },
        data: { status: "CONFIRMED" },
      });
    });
  } catch (err) {
    // Someone already paid this booking from the wallet — treat it as done
    // rather than charging again.
    if (isUniqueViolation(err)) throw new Error("ALREADY_PAID");
    throw err;
  }

  // Hold the money in the teacher's wallet until the class is over.
  await creditBookingToWallet(booking.id);

  await createNotification({
    userId: booking.studentId,
    type: "PAYMENT_SUCCESS",
    title: "Payment successful",
    message: "Your wallet paid for the class and it's now confirmed.",
    metadata: { bookingId: booking.id },
  });
  await createNotification({
    userId: booking.teacherId,
    type: "BOOKING_CONFIRMED",
    title: "New booking confirmed",
    message: "A student paid for a class — it's now confirmed on your schedule.",
    metadata: { bookingId: booking.id },
  });

  return { paid: true, amount, currency };
}

/**
 * Returns a cancelled booking's money to the student's wallet and takes the
 * matching escrow back off the teacher.
 *
 * Only money still on hold can be refunded — once a class is over and the
 * teacher's earnings have cleared, the booking is settled and this throws.
 */
export async function refundBookingToStudent(bookingId: string, reason?: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true },
  });
  if (!booking) throw new Error("BOOKING_NOT_FOUND");

  // Nothing was ever paid — nothing to give back.
  if (!booking.payment || booking.payment.status !== "COMPLETED") return { refunded: false };

  const [deposit, release] = await Promise.all([
    prisma.walletTransaction.findFirst({ where: { bookingId, type: "DEPOSIT" } }),
    prisma.walletTransaction.findFirst({ where: { bookingId, type: "RELEASE" } }),
  ]);
  if (release) throw new Error("ESCROW_RELEASED");

  const amount = new Prisma.Decimal(booking.payment.amount);
  const studentWallet = await getWalletForUser(booking.studentId);

  try {
    await prisma.$transaction(async (tx) => {
      // Take the escrow back off the teacher first.
      if (deposit && deposit.status === "COMPLETED") {
        await tx.walletTransaction.create({
          data: {
            walletId: deposit.walletId,
            bookingId,
            type: "REVERSAL",
            amount: deposit.amount,
            status: "COMPLETED",
            description: "Class cancelled — payment returned to the student",
          },
        });
        await tx.wallet.update({
          where: { id: deposit.walletId },
          data: { pendingBalance: { decrement: deposit.amount } },
        });
      }

      await tx.walletTransaction.create({
        data: {
          walletId: studentWallet.id,
          bookingId,
          type: "REFUND",
          amount,
          status: "COMPLETED",
          description: reason ? `Class cancelled — ${reason}` : "Class cancelled — refunded to your wallet",
        },
      });

      await tx.wallet.update({
        where: { id: studentWallet.id },
        data: { releasedBalance: { increment: amount } },
      });

      // Wallet-funded bookings never really left the platform, but marking the
      // payment refunded keeps both routes reading the same way.
      await tx.payment.update({
        where: { id: booking.payment!.id },
        data: { status: "REFUNDED" },
      });
    });
  } catch (err) {
    if (isUniqueViolation(err)) return { refunded: false }; // already refunded
    throw err;
  }

  return { refunded: true, amount };
}

/**
 * Everything the student's wallet screen needs: the spendable balance, recent
 * activity, and the classes that are still waiting to be paid for.
 */
export async function getStudentWalletSnapshot(userId: string) {
  const wallet = await getWalletForUser(userId);

  const [transactions, unpaid] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        booking: {
          select: {
            id: true,
            timeSlot: { select: { startTime: true } },
            teacher: { select: { firstName: true, lastName: true } },
            inquiry: { select: { post: { select: { title: true, subject: true } } } },
          },
        },
      },
    }),
    prisma.booking.findMany({
      where: { studentId: userId, status: "PENDING_PAYMENT" },
      select: {
        id: true,
        fee: true,
        timeSlot: { select: { startTime: true, endTime: true } },
        teacher: { select: { firstName: true, lastName: true } },
        inquiry: { select: { post: { select: { title: true, subject: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    ...wallet,
    transactions: transactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      status: t.status,
      description: t.description,
      createdAt: t.createdAt,
      bookingId: t.bookingId,
      title: t.booking?.inquiry?.post?.title || t.booking?.inquiry?.post?.subject || null,
      teacherName: t.booking
        ? `${t.booking.teacher?.firstName ?? ""} ${t.booking.teacher?.lastName ?? ""}`.trim()
        : null,
    })),
    unpaidBookings: unpaid.map((b) => ({
      bookingId: b.id,
      amount: b.fee,
      startTime: b.timeSlot?.startTime ?? null,
      title: b.inquiry?.post?.title || b.inquiry?.post?.subject || "Class",
      teacherName: `${b.teacher?.firstName ?? ""} ${b.teacher?.lastName ?? ""}`.trim(),
    })),
  };
}
