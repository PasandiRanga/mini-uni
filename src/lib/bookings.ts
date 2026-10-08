import prisma from "./prisma";
import { refundBookingToStudent } from "./wallet";
import { releaseSeat } from "./seats";

/** Bookings that still hold a seat and haven't happened yet. */
export const OPEN_BOOKING_STATUSES = ["PENDING_PAYMENT", "PAYMENT_COMPLETED", "CONFIRMED"] as const;

/**
 * Cancels one booking: refunds anything paid to the student's wallet, marks
 * it cancelled and gives the seat back. Throws ESCROW_RELEASED when the money
 * has already been paid out to the teacher.
 */
export async function cancelBooking(bookingId: string, reason?: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error("NOT_FOUND");

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
