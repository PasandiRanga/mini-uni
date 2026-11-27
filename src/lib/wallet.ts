import { Prisma, WithdrawalStatus } from "@prisma/client";
import prisma from "./prisma";
import { createNotification } from "./notifications";
import { splitCommission, commissionPercent } from "./commission";
import { DISPUTE_WINDOW_MS } from "./disputeReasons";
import { createClassEvent, isGoogleConfigured } from "./googleCalendar";
import { sendEmail, buildNoticeEmail } from "./email";

/**
 * Escrow model
 * ------------
 * A student's payment lands in the teacher's wallet as *pending* money. It
 * clears into the *released* (withdrawable) balance DISPUTE_WINDOW_HOURS after
 * the class ends, which gives the student time to report a problem (or earlier
 * if both sides confirm the class is complete). A reported class stays on hold
 * until an admin settles it. Only released money can be withdrawn.
 *
 * Students have a wallet too. Theirs holds spendable money rather than
 * earnings: refunds from cancelled classes land there, students can top it up
 * by card, and the balance can be spent on a class instead of paying by card.
 * Both roles share `releasedBalance` : for a teacher it is what they can
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
 * than once for the same booking : the DEPOSIT entry is unique per booking, so
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
          description: "Payment received : held until the class is over",
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
          description: "Class completed : earnings available to withdraw",
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

/** When a class's money clears to the teacher, given when it ends. */
export const escrowReleasesAt = (endTime: Date) => new Date(endTime.getTime() + DISPUTE_WINDOW_MS);

export type NoShowOutcome = "STUDENT_NO_SHOW" | "TEACHER_NO_SHOW" | "BOTH_NO_SHOW";

const noShowReason = (outcome: NoShowOutcome) =>
  outcome === "STUDENT_NO_SHOW"
    ? "The student didn't join the class"
    : outcome === "TEACHER_NO_SHOW"
      ? "The teacher didn't join the class"
      : "Neither side joined the class";

/**
 * Settles a class that didn't take place, moving money per the no-show policy.
 * The platform's normal service fee is NOT taken (the class never completed);
 * instead the side at fault forfeits a 10% fee:
 *
 * - STUDENT_NO_SHOW: student refunded the fee less a 10% absence fee; teacher paid nothing.
 * - TEACHER_NO_SHOW: student refunded in full; teacher charged a 10% penalty.
 * - BOTH_NO_SHOW:    student refunded less the 10% absence fee AND teacher charged 10%.
 *
 * Idempotent: each wallet entry is unique per booking and settlementOutcome
 * guards re-entry, so a repeat call is a no-op.
 */
export async function settleNoShowBooking(bookingId: string, outcome: NoShowOutcome) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { payment: true } });
  if (!booking) throw new Error("BOOKING_NOT_FOUND");
  if (booking.settlementOutcome) return { settled: false as const }; // already settled

  const [deposit, release] = await Promise.all([
    prisma.walletTransaction.findFirst({ where: { bookingId, type: "DEPOSIT" } }),
    prisma.walletTransaction.findFirst({ where: { bookingId, type: "RELEASE" } }),
  ]);
  if (release) throw new Error("ESCROW_RELEASED"); // already paid out to the teacher

  // Nothing was ever escrowed (unpaid): just record the outcome.
  if (!deposit || deposit.status !== "COMPLETED" || booking.payment?.status !== "COMPLETED") {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { settlementOutcome: outcome, status: "CANCELLED", cancelledAt: new Date(), cancellationReason: noShowReason(outcome) },
    });
    return { settled: true as const, moved: false };
  }

  const gross = new Prisma.Decimal(deposit.amount);
  const { fee } = splitCommission(gross); // 10%
  const teacherWalletId = deposit.walletId;
  const studentWallet = await getWalletForUser(booking.studentId);
  const studentAbsence = outcome === "TEACHER_NO_SHOW" ? new Prisma.Decimal(0) : fee;
  const teacherPenalty = outcome === "TEACHER_NO_SHOW" || outcome === "BOTH_NO_SHOW" ? fee : new Prisma.Decimal(0);

  try {
    await prisma.$transaction(async (tx) => {
      // 1) Take the escrow back off the teacher's pending balance.
      await tx.walletTransaction.create({
        data: { walletId: teacherWalletId, bookingId, type: "REVERSAL", amount: gross, status: "COMPLETED", description: "Class didn't take place : escrow returned" },
      });
      await tx.wallet.update({ where: { id: teacherWalletId }, data: { pendingBalance: { decrement: gross } } });

      // 2) Refund the student the full fee first...
      await tx.walletTransaction.create({
        data: { walletId: studentWallet.id, bookingId, type: "REFUND", amount: gross, status: "COMPLETED", description: `${noShowReason(outcome)} : refunded to your wallet` },
      });
      await tx.wallet.update({ where: { id: studentWallet.id }, data: { releasedBalance: { increment: gross } } });

      // 3) ...then keep the student's 10% absence fee when the student was at fault.
      if (studentAbsence.gt(0)) {
        await tx.walletTransaction.create({
          data: { walletId: studentWallet.id, bookingId, type: "ABSENCE_FEE", amount: studentAbsence, status: "COMPLETED", description: `No-show absence fee (${commissionPercent()}%)` },
        });
        await tx.wallet.update({ where: { id: studentWallet.id }, data: { releasedBalance: { decrement: studentAbsence } } });
      }

      // 4) Charge the teacher a 10% penalty when the teacher was at fault.
      if (teacherPenalty.gt(0)) {
        await tx.walletTransaction.create({
          data: { walletId: teacherWalletId, bookingId, type: "PENALTY", amount: teacherPenalty, status: "COMPLETED", description: `No-show penalty (${commissionPercent()}%)` },
        });
        await tx.wallet.update({ where: { id: teacherWalletId }, data: { releasedBalance: { decrement: teacherPenalty } } });
      }

      // 5) Mark the payment refunded and record the outcome.
      await tx.payment.update({ where: { id: booking.payment!.id }, data: { status: "REFUNDED" } });
      await tx.booking.update({
        where: { id: bookingId },
        data: { settlementOutcome: outcome, status: "CANCELLED", cancelledAt: new Date(), cancellationReason: noShowReason(outcome) },
      });
    });
    return { settled: true as const, moved: true, gross, studentAbsence, teacherPenalty };
  } catch (err) {
    if (isUniqueViolation(err)) return { settled: false as const }; // settled concurrently
    throw err;
  }
}

/** Notifies both sides when a class is settled (completed or a no-show). */
async function notifyBoth(studentId: string, teacherId: string, bookingId: string, student: { title: string; message: string }, teacher: { title: string; message: string }) {
  await createNotification({ userId: studentId, type: "CLASS_COMPLETION", title: student.title, message: student.message, metadata: { bookingId } });
  await createNotification({ userId: teacherId, type: "CLASS_COMPLETION", title: teacher.title, message: teacher.message, metadata: { bookingId } });
}

/** Raises a conflict for an admin: teacher says the student was absent, student says it happened. */
async function raiseNoShowConflict(bookingId: string, teacherId: string, studentId: string, title: string) {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.dispute.findUnique({ where: { bookingId }, select: { id: true } });
    if (existing) return;
    await tx.booking.update({ where: { id: bookingId }, data: { status: "DISPUTED" } });
    await tx.dispute.create({
      data: {
        bookingId,
        reportedById: teacherId,
        reason: "STUDENT_NO_SHOW",
        details: "The teacher reported that the student didn't join, but the student marked the class as completed. Please review (check the Google Meet history or screenshot).",
      },
    });
  });
  const admins = await prisma.user.findMany({ where: { role: "ADMIN", isActive: true }, select: { id: true } });
  for (const a of admins) {
    await createNotification({ userId: a.id, type: "CLASS_COMPLETION", title: "A no-show needs review", message: `Teacher and student disagree on "${title}". Review who attended.`, metadata: { bookingId } });
  }
}

/**
 * Settles every class (for one teacher or student) whose report window has
 * closed and that hasn't been settled yet, deciding the outcome from who
 * confirmed or reported:
 * - either side confirmed it happened (and nobody reported)  -> pay the teacher
 * - teacher reported the student absent, student stayed quiet -> student no-show
 * - nobody confirmed or reported                             -> both no-show
 * - teacher reported absent but the student confirmed         -> admin review
 * A booking with an open dispute is left for an admin. Called whenever classes
 * or wallets are read, so balances stay right without a background job.
 */
export async function settleDueBookings(who: { teacherId: string } | { studentId: string }) {
  const windowAgo = new Date(Date.now() - DISPUTE_WINDOW_MS);
  const due = await prisma.booking.findMany({
    where: {
      ...who,
      status: "COMPLETED",
      settlementOutcome: null,
      dispute: { is: null },
      timeSlot: { endTime: { lte: windowAgo } },
      walletTransactions: { some: { type: "DEPOSIT", status: "COMPLETED" }, none: { type: "RELEASE" } },
    },
    select: {
      id: true, studentId: true, teacherId: true,
      studentConfirmed: true, teacherConfirmed: true, teacherMarkedAbsent: true,
      inquiry: { select: { post: { select: { title: true, subject: true } } } },
    },
  });

  let settled = 0;
  for (const b of due) {
    const title = b.inquiry?.post?.title || b.inquiry?.post?.subject || "your class";
    try {
      if (b.teacherMarkedAbsent && b.studentConfirmed) {
        await raiseNoShowConflict(b.id, b.teacherId, b.studentId, title);
      } else if (b.teacherConfirmed || b.studentConfirmed) {
        const r = await releaseBookingEscrow(b.id);
        await prisma.booking.update({ where: { id: b.id }, data: { settlementOutcome: "COMPLETED" } });
        if (r.released) {
          await notifyBoth(b.studentId, b.teacherId, b.id,
            { title: "Class complete", message: `"${title}" is complete and settled.` },
            { title: "Earnings released", message: `Your earnings for "${title}" have been released from escrow.` });
        }
      } else if (b.teacherMarkedAbsent) {
        await settleNoShowBooking(b.id, "STUDENT_NO_SHOW");
        await notifyBoth(b.studentId, b.teacherId, b.id,
          { title: "Marked as a no-show", message: `You didn't join "${title}". A ${commissionPercent()}% absence fee was kept and the rest refunded to your wallet.` },
          { title: "Student didn't join", message: `The student didn't join "${title}", so this class wasn't paid.` });
      } else {
        await settleNoShowBooking(b.id, "BOTH_NO_SHOW");
        await notifyBoth(b.studentId, b.teacherId, b.id,
          { title: "Marked as a no-show", message: `Neither side joined "${title}". A ${commissionPercent()}% absence fee was kept and the rest refunded to your wallet.` },
          { title: "Marked as a no-show", message: `Neither side joined "${title}". A ${commissionPercent()}% no-show penalty was applied.` });
      }
      settled += 1;
    } catch (err) {
      console.error(`Couldn't settle booking ${b.id}:`, err);
    }
  }
  return settled;
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
      status: true,
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
    // A reported class waits for an admin, so it has no release date.
    underReview: h.status === "DISPUTED",
    releasesAt: h.status === "DISPUTED" || !h.timeSlot ? null : escrowReleasesAt(h.timeSlot.endTime),
    startTime: h.timeSlot?.startTime ?? null,
    title: h.inquiry?.post?.title || h.inquiry?.post?.subject || "Class",
    studentName: `${h.student?.firstName ?? ""} ${h.student?.lastName ?? ""}`.trim(),
  }));
}

/**
 * Debits the released balance and records a withdrawal request. The debit is
 * guarded by the balance itself, so two requests racing for the same money can
 * never overdraw the wallet : the second one finds nothing to take.
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
 * Admin : withdrawal payouts
 *
 * A teacher requests a withdrawal (see requestWithdrawal above), which debits
 * their released balance immediately and creates a PENDING request. An admin
 * then works the queue: PROCESSING while the bank transfer is in flight, PAID
 * once the money is sent, or REJECTED : which puts the debited money back.
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
 * Moves a still-open withdrawal to PROCESSING : the payout has been started at
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
 * payout : no balance change.
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
 * balance : the mirror of cancelWithdrawal, but admin-initiated and with a
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
      data: { status: "FAILED", description: "Withdrawal rejected : amount returned" },
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
  await settleDueBookings({ teacherId: userId });

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
 * no escrow on this side : `releasedBalance` is simply the balance.
 * -------------------------------------------------------------------------- */

/** Smallest amount a student can add in one top-up, per currency. */
export const MIN_TOP_UP: Record<string, number> = { LKR: 500, USD: 2 };

export const minTopUp = (currency?: string) => MIN_TOP_UP[currency || "LKR"] ?? MIN_TOP_UP.LKR;

/**
 * Records a top-up a student has deposited for but not had verified yet. It
 * stays PENDING, carrying the bank slip, until an admin checks the amount and
 * approves it : `completeTopUp` is what actually credits the balance.
 */
export async function startTopUp(userId: string, amount: Prisma.Decimal, slipUrl: string) {
  const wallet = await getWalletForUser(userId);

  return prisma.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: "TOP_UP",
      amount,
      status: "PENDING",
      description: "Wallet top-up : awaiting verification",
      slipUrl,
    },
  });
}

/**
 * Top-up requests for the admin review queue. Defaults to PENDING (the ones
 * waiting on a decision); pass "COMPLETED", "FAILED" or "ALL" for the rest.
 */
export async function getTopUpRequestsForAdmin(status = "PENDING") {
  const where: Prisma.WalletTransactionWhereInput = { type: "TOP_UP" };
  if (status && status !== "ALL") where.status = status;

  const items = await prisma.walletTransaction.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      wallet: {
        select: { user: { select: { id: true, firstName: true, lastName: true, email: true, currency: true } } },
      },
    },
  });

  return items.map((t) => ({
    id: t.id,
    amount: t.amount,
    status: t.status,
    slipUrl: t.slipUrl,
    description: t.description,
    createdAt: t.createdAt,
    currency: t.wallet?.user?.currency || "LKR",
    student: t.wallet?.user
      ? {
          id: t.wallet.user.id,
          name: `${t.wallet.user.firstName ?? ""} ${t.wallet.user.lastName ?? ""}`.trim(),
          email: t.wallet.user.email,
        }
      : null,
  }));
}

/**
 * Credits a paid top-up. Safe to call more than once : the gateway can and does
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

/** Marks a top-up that was never completed (abandoned, or rejected by an admin). */
export async function failTopUp(transactionId: string, reason?: string) {
  const updated = await prisma.walletTransaction.updateMany({
    where: { id: transactionId, status: "PENDING", type: "TOP_UP" },
    data: { status: "FAILED", description: reason || "Top-up not completed" },
  });
  return { abandoned: updated.count > 0 };
}

/** Same, but only for the student who owns the top-up : used when they close the checkout. */
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
export async function payBookingFromWallet(userId: string, bookingId: string, origin?: string) {
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
    // Someone already paid this booking from the wallet : treat it as done
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
    message: "A student paid for a class : it's now confirmed on your schedule.",
    metadata: { bookingId: booking.id },
  });

  // Put the class on the teacher's Google calendar with a Meet link, if connected.
  await createMeetLinkForBooking(booking.id);

  // Email both sides that the class is booked. Best-effort.
  await emailBookingConfirmation(booking.id, origin);

  return { paid: true, amount, currency };
}

/**
 * Emails the student and teacher that a class is booked and confirmed. Honors
 * each user's email preference and never throws : the booking stands regardless.
 */
export async function emailBookingConfirmation(bookingId: string, origin?: string) {
  try {
    const b = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        googleMeetLink: true,
        student: { select: { email: true, notifyEmail: true } },
        teacher: { select: { email: true, notifyEmail: true } },
        timeSlot: { select: { startTime: true } },
        inquiry: { select: { post: { select: { title: true, subject: true } } } },
      },
    });
    if (!b) return;

    const title = b.inquiry?.post?.title || b.inquiry?.post?.subject || "your class";
    const when = b.timeSlot?.startTime
      ? new Date(b.timeSlot.startTime).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
      : "the scheduled time";
    const base = origin || "";
    const meetLine = b.googleMeetLink ? " A Google Meet link has been added to your calendar." : "";

    if (b.student?.email && b.student.notifyEmail !== false) {
      await sendEmail({
        to: b.student.email,
        ...buildNoticeEmail({
          subject: "Your class is booked",
          heading: "Class confirmed",
          body: `Your booking for "${title}" on ${when} is confirmed and paid from your wallet.${meetLine}`,
          link: `${base}/student/dashboard?tab=classes`,
          cta: "View your classes",
        }),
      }).catch((e) => console.error("Failed to email student booking confirmation:", e));
    }

    if (b.teacher?.email && b.teacher.notifyEmail !== false) {
      await sendEmail({
        to: b.teacher.email,
        ...buildNoticeEmail({
          subject: "New booking confirmed",
          heading: "New booking",
          body: `A student booked and paid for "${title}" on ${when}. It's confirmed on your schedule.${meetLine}`,
          link: `${base}/teacher/dashboard?tab=classes`,
          cta: "View your schedule",
        }),
      }).catch((e) => console.error("Failed to email teacher booking confirmation:", e));
    }
  } catch (err) {
    console.error("Failed to send booking confirmation emails:", err);
  }
}

/**
 * Best-effort: puts a confirmed class on the teacher's Google calendar with a
 * Meet link and notifies both sides. A no-op when Google isn't configured, the
 * teacher hasn't connected, or the class already has a link : the booking is
 * confirmed either way, so this never throws.
 */
export async function createMeetLinkForBooking(bookingId: string) {
  try {
    if (!isGoogleConfigured()) return;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        googleMeetLink: true,
        studentId: true,
        teacherId: true,
        student: { select: { email: true } },
        teacher: { select: { email: true, googleAccount: { select: { refreshToken: true } } } },
        timeSlot: { select: { startTime: true, endTime: true } },
        inquiry: { select: { post: { select: { title: true, subject: true } } } },
      },
    });

    const refreshToken = booking?.teacher?.googleAccount?.refreshToken;
    if (
      !booking ||
      booking.googleMeetLink ||
      !refreshToken ||
      !booking.timeSlot ||
      !booking.student?.email ||
      !booking.teacher?.email
    ) {
      return;
    }

    const title = booking.inquiry?.post?.title || booking.inquiry?.post?.subject || "MiniUni class";
    const { hangoutLink } = await createClassEvent({
      refreshToken,
      summary: title,
      description: "Booked through MiniUni.",
      startISO: booking.timeSlot.startTime.toISOString(),
      endISO: booking.timeSlot.endTime.toISOString(),
      teacherEmail: booking.teacher.email,
      studentEmail: booking.student.email,
    });
    if (!hangoutLink) return;

    await prisma.booking.update({ where: { id: bookingId }, data: { googleMeetLink: hangoutLink } });

    await createNotification({
      userId: booking.studentId,
      type: "MEETING_LINK_CREATED",
      title: "Class link ready",
      message: "Your class has a Google Meet link : check your calendar for the invite.",
      metadata: { bookingId },
    });
    await createNotification({
      userId: booking.teacherId,
      type: "MEETING_LINK_CREATED",
      title: "Class link ready",
      message: "A Meet link was added to your calendar for the booked class.",
      metadata: { bookingId },
    });
  } catch (err) {
    console.error("Failed to create Meet link for booking:", err);
  }
}

/**
 * Generates Meet links for a user's confirmed, not-yet-ended classes that are
 * missing one : covering classes booked before the teacher connected Google.
 * Idempotent and best-effort, so it's safe to call on every class-list read; it
 * does nothing once the links exist (or when Google isn't set up).
 */
export async function backfillMeetLinks(where: Prisma.BookingWhereInput) {
  try {
    if (!isGoogleConfigured()) return;
    const due = await prisma.booking.findMany({
      where: {
        ...where,
        status: { in: ["PAYMENT_COMPLETED", "CONFIRMED", "IN_PROGRESS"] },
        googleMeetLink: null,
        timeSlot: { endTime: { gt: new Date() } },
        teacher: { googleAccount: { isNot: null } },
      },
      select: { id: true },
      take: 20,
    });
    for (const b of due) await createMeetLinkForBooking(b.id);
  } catch (err) {
    console.error("Failed to backfill Meet links:", err);
  }
}

/**
 * Returns a cancelled booking's money to the student's wallet and takes the
 * matching escrow back off the teacher.
 *
 * Only money still on hold can be refunded : once a class is over and the
 * teacher's earnings have cleared, the booking is settled and this throws.
 */
export async function refundBookingToStudent(
  bookingId: string,
  reason?: string,
  cancelledByUserId?: string,
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true },
  });
  if (!booking) throw new Error("BOOKING_NOT_FOUND");

  // Nothing was ever paid : nothing to give back.
  if (!booking.payment || booking.payment.status !== "COMPLETED") return { refunded: false };

  const [deposit, release] = await Promise.all([
    prisma.walletTransaction.findFirst({ where: { bookingId, type: "DEPOSIT" } }),
    prisma.walletTransaction.findFirst({ where: { bookingId, type: "RELEASE" } }),
  ]);
  if (release) throw new Error("ESCROW_RELEASED");

  const gross = new Prisma.Decimal(booking.payment.amount);
  const { fee: cancellationFee } =
    cancelledByUserId === booking.studentId
      ? splitCommission(gross, 10)
      : { fee: new Prisma.Decimal(0) };
  const { fee: teacherCancellationFee } =
    cancelledByUserId === booking.teacherId
      ? splitCommission(gross, 10)
      : { fee: new Prisma.Decimal(0) };
  const amount = gross.sub(cancellationFee);
  const refundedAmount = cancelledByUserId === booking.studentId ? amount : gross;
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
            description: "Class cancelled : payment returned to the student",
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
          amount: refundedAmount,
          status: "COMPLETED",
          description: cancellationFee.gt(0)
            ? `Class cancelled : 10% cancellation fee kept; ${reason ?? "rest refunded"}`
            : reason ? `Class cancelled : ${reason}` : "Class cancelled : refunded to your wallet",
        },
      });

      await tx.wallet.update({
        where: { id: studentWallet.id },
        data: { releasedBalance: { increment: refundedAmount } },
      });

      if (cancellationFee.gt(0)) {
        await tx.walletTransaction.create({
          data: {
            walletId: studentWallet.id,
            bookingId,
            type: "ABSENCE_FEE",
            amount: cancellationFee,
            status: "COMPLETED",
            description: "Student cancellation fee (10%)",
          },
        });
      }

      if (teacherCancellationFee.gt(0)) {
        const teacherWallet = await getWalletForUser(booking.teacherId);
        await tx.walletTransaction.create({
          data: {
            walletId: teacherWallet.id,
            bookingId,
            type: "PENALTY",
            amount: teacherCancellationFee,
            status: "COMPLETED",
            description: "Teacher cancellation fee (10%)",
          },
        });
        await tx.wallet.update({
          where: { id: teacherWallet.id },
          data: { releasedBalance: { decrement: teacherCancellationFee } },
        });
      }

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

  return {
    refunded: true,
    amount: refundedAmount,
    cancellationFee: cancellationFee.plus(teacherCancellationFee),
  };
}

/**
 * Everything the student's wallet screen needs: the spendable balance, recent
 * activity, and the classes that are still waiting to be paid for.
 */
export async function getStudentWalletSnapshot(userId: string) {
  const wallet = await getWalletForUser(userId);

  const [transactions, unpaid, held] = await Promise.all([
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
    // Paid for but not settled yet: the class hasn't happened, or it's under review.
    // This money comes back if the class is cancelled or a report is upheld.
    prisma.booking.findMany({
      where: {
        studentId: userId,
        status: { in: ["PAYMENT_COMPLETED", "CONFIRMED", "IN_PROGRESS", "DISPUTED"] },
        payment: { status: "COMPLETED" },
      },
      select: {
        id: true,
        status: true,
        payment: { select: { amount: true } },
        timeSlot: { select: { startTime: true } },
        teacher: { select: { firstName: true, lastName: true } },
        inquiry: { select: { post: { select: { title: true, subject: true } } } },
      },
      orderBy: { timeSlot: { startTime: "asc" } },
    }),
  ]);

  const heldAmount = held.reduce((sum, b) => sum.plus(b.payment?.amount ?? 0), new Prisma.Decimal(0));

  return {
    ...wallet,
    heldAmount,
    heldBookings: held.map((b) => ({
      bookingId: b.id,
      amount: b.payment?.amount ?? 0,
      startTime: b.timeSlot?.startTime ?? null,
      underReview: b.status === "DISPUTED",
      title: b.inquiry?.post?.title || b.inquiry?.post?.subject || "Class",
      teacherName: `${b.teacher?.firstName ?? ""} ${b.teacher?.lastName ?? ""}`.trim(),
    })),
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
