import prisma from "./prisma";
import { refundBookingToStudent, settleDueBookings } from "./wallet";
import { releaseSeat } from "./seats";
import { createNotification } from "./notifications";
import { DISPUTE_WINDOW_HOURS } from "./disputeReasons";

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
 * a paid class that has ended becomes COMPLETED, its earnings are released
 * once the report window has closed (see settleDueBookings), and a booking
 * still unpaid when its class started is cancelled.
 *
 * Runs whenever classes or wallets are loaded, so statuses and balances are
 * right without a background job. Safe to run repeatedly or concurrently:
 * each step only acts on rows still in the earlier state.
 */
export async function settleFinishedBookings(who: { teacherId: string } | { studentId: string }) {
  const now = new Date();

  const finished = await prisma.booking.findMany({
    where: { ...who, status: { in: [...PAID_BOOKING_STATUSES] }, timeSlot: { endTime: { lte: now } } },
    select: { id: true, studentId: true, teacherId: true, teacher: { select: { firstName: true } } },
  });
  for (const b of finished) {
    try {
      const { count } = await prisma.booking.updateMany({
        where: { id: b.id, status: { in: [...PAID_BOOKING_STATUSES] } },
        data: { status: "COMPLETED", completedAt: now },
      });
      // Only the run that completed it prompts both sides, so it's asked once.
      if (count === 1) {
        await createNotification({
          userId: b.studentId,
          type: "CLASS_COMPLETION",
          title: "Did your class happen?",
          message: `Confirm your class with ${b.teacher.firstName} went ahead, or report a problem if it did not. You have ${DISPUTE_WINDOW_HOURS} hours. Find it in My Classes.`,
          metadata: { bookingId: b.id },
        });
        await createNotification({
          userId: b.teacherId,
          type: "CLASS_COMPLETION",
          title: "Did your class happen?",
          message: `Confirm your class went ahead, or mark the student as a no-show if they didn't join. You have ${DISPUTE_WINDOW_HOURS} hours. Find it in My Classes.`,
          metadata: { bookingId: b.id },
        });
      }
    } catch (err) {
      console.error(`Couldn't complete booking ${b.id}:`, err);
    }
  }

  try {
    // Window closed: pay out, apply no-show fees, or send conflicts to an admin.
    await settleDueBookings(who);
  } catch (err) {
    console.error("Couldn't settle due bookings:", err);
  }

  // Never paid and the class has started: nothing to refund, nothing to teach.
  await prisma.booking.updateMany({
    where: { ...who, status: "PENDING_PAYMENT", timeSlot: { startTime: { lte: now } } },
    data: { status: "CANCELLED", cancelledAt: now, cancellationReason: "Not paid before the class started" },
  });
}
