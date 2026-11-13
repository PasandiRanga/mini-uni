import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { releaseBookingEscrow } from "@/lib/wallet";
import { createNotification } from "@/lib/notifications";

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

        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
        });

        if (!booking) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        // A reported class is settled by an admin, not by confirming it.
        if (booking.status === "DISPUTED" || booking.status === "CANCELLED") {
            return NextResponse.json({ error: "This class can't be confirmed" }, { status: 400 });
        }

        const updateData: any = {};
        if (booking.studentId === userId) updateData.studentConfirmed = true;
        if (booking.teacherId === userId) updateData.teacherConfirmed = true;

        if (!updateData.studentConfirmed && !updateData.teacherConfirmed) {
            return NextResponse.json({ error: "Not authorized to confirm this booking" }, { status: 403 });
        }

        const updated = await prisma.booking.update({
            where: { id: bookingId },
            data: updateData,
        });

        if (updated.studentConfirmed && updated.teacherConfirmed) {
            // Both sides agree the class happened. Mark it complete if a finished
            // class hasn't already been auto-completed, then clear the escrow now
            // rather than waiting out the report window. releaseBookingEscrow is
            // idempotent, so confirming an already-paid class does nothing.
            if (updated.status !== "COMPLETED") {
                await prisma.booking.update({
                    where: { id: bookingId },
                    data: { status: "COMPLETED", completedAt: new Date() },
                });
            }

            const release = await releaseBookingEscrow(bookingId);

            // Notify both sides only on the run that actually releases the money,
            // so the message is sent once.
            if (release.released) {
                for (const uid of [booking.studentId, booking.teacherId]) {
                    await createNotification({
                        userId: uid,
                        type: "CLASS_COMPLETION",
                        title: "Class confirmed",
                        message: "You both confirmed the class happened, so the teacher's earnings have been released from escrow.",
                        metadata: { bookingId },
                    });
                }
            }

            return NextResponse.json({ ...updated, status: "COMPLETED" });
        }

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error("Error confirming booking:", error);
        return NextResponse.json({ error: error.message || "Failed to confirm booking" }, { status: 400 });
    }
}
