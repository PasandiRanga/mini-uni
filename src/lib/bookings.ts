import prisma from "./prisma";
import { refundBookingToStudent, releaseBookingEscrow } from "./wallet";
import { releaseSeat } from "./seats";

/** Bookings that still hold a seat and haven't happened yet. */
export const OPEN_BOOKING_STATUSES = ["PENDING_PAYMENT", "PAYMENT_COMPLETED", "CONFIRMED"] as const;

/** Paid bookings that become COMPLETED once their class has ended. */
const PAID_BOOKING_STATUSES = ["PAYMENT_COMPLETED", "CONFIRMED", "IN_PROGRESS"] as const;

/**
 * Cancels one booking: refunds anything paid to the student's wallet, marks
 * it cancelled and gives the seat back. Throws CLASS_STARTED once the class
 * has begun (a finished class can't be refunded), and ESCROW_RELEASED when
 * the money has already been paid out to the teacher.
 */
export async function cancelBooking(bookingId: string, reason?: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { timeSlot: { select: { startTime: true } } },
  });
  if (!booking) throw new Error("NOT_FOUND");
  if (booking.timeSlot.startTime.getTime() <= Date.now()) throw new Error("CLASS_STARTED");

  // Refund first: if the money has already cleared into the teacher's
  // earnings there is nothing to reverse, and the booking stays as it is.
  const refund = await refundBookingToStudent(bookingId, reason);

  // Cancel and give the seat back together, so a group slot's seat count
  // never disagrees with its bookings.
  const cancelled = await prisma.$transaction(async (tx) => {
    const updated = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancellationReason: reason ?? null,
      },
    });
    await releaseSeat(tx, booking.timeSlotId);
    return updated;
  });

  return { booking: cancelled, refunded: refund.refunded };
}

/**
 * Closes out classes whose time has passed, for one teacher or student:
 * a paid class that has ended becomes COMPLETED and the teacher's earnings
 * are released; a booking still unpaid when its class started is cancelled.
 *
 * Runs whenever classes or wallets are loaded, so statuses and balances are
 * right without a background job. Safe to run repeatedly or concurrently:
 * each step only acts on rows still in the earlier state.
 */
export async function settleFinishedBookings(who: { teacherId: string } | { studentId: string }) {
  const now = new Date();

  const finished = await prisma.booking.findMany({
    where: { ...who, status: { in: [...PAID_BOOKING_STATUSES] }, timeSlot: { endTime: { lte: now } } },
    select: { id: true },
  });
  for (const b of finished) {
    try {
      await releaseBookingEscrow(b.id); // no-op if already released or never paid via the wallet
      await prisma.booking.updateMany({
        where: { id: b.id, status: { in: [...PAID_BOOKING_STATUSES] } },
        data: { status: "COMPLETED", completedAt: now },
      });
    } catch (err) {
      console.error(`Couldn't complete booking ${b.id}:`, err);
    }
  }

  // Never paid and the class has started: nothing to refund, nothing to teach.
  await prisma.booking.updateMany({
    where: { ...who, status: "PENDING_PAYMENT", timeSlot: { startTime: { lte: now } } },
    data: { status: "CANCELLED", cancelledAt: now, cancellationReason: "Not paid before the class started" },
  });
}
