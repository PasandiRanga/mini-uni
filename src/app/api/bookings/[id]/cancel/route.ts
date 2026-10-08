export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { cancelBooking } from "@/lib/bookings";

/**
 * Cancels a booking. Either side can cancel a class that hasn't happened yet;
 * anything already paid goes back to the student's wallet and comes off the
 * teacher's held balance.
 */
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await getSessionFromRequest(request);
    if (!session || !session.sub) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const bookingId = params.id;
        const userId = session.sub;

        const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
        if (!booking) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }
        if (booking.studentId !== userId && booking.teacherId !== userId) {
            return NextResponse.json({ error: "Not authorized to cancel this booking" }, { status: 403 });
        }
        if (booking.status === "CANCELLED") {
            return NextResponse.json({ error: "This class is already cancelled" }, { status: 400 });
        }
        if (booking.status === "COMPLETED") {
            return NextResponse.json({ error: "A completed class can't be cancelled" }, { status: 400 });
        }

        const body = await request.json().catch(() => ({}));
        const reason: string | undefined = body?.reason?.toString().trim() || undefined;

        const { booking: cancelled, refunded } = await cancelBooking(bookingId, reason);

        // Notify whoever didn't press cancel.
        const otherPartyId = userId === booking.studentId ? booking.teacherId : booking.studentId;
        await createNotification({
            userId: otherPartyId,
            type: "BOOKING_CANCELLED",
            title: "Class cancelled",
            message: reason
                ? `A booked class was cancelled: ${reason}`
                : "A booked class was cancelled.",
            metadata: { bookingId, refunded },
        });

        return NextResponse.json({ ...cancelled, refunded });
    } catch (error: any) {
        if (error?.message === "ESCROW_RELEASED") {
            return NextResponse.json(
                { error: "This class is already settled and can no longer be cancelled" },
                { status: 400 }
            );
        }
        console.error("Error cancelling booking:", error);
        return NextResponse.json({ error: error.message || "Failed to cancel booking" }, { status: 400 });
    }
}
