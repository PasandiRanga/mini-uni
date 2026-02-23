import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { releaseEscrow } from "@/lib/wallet";

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

        if (updated.studentConfirmed && updated.teacherConfirmed && updated.status !== "COMPLETED") {
            const completedBooking = await prisma.booking.update({
                where: { id: bookingId },
                data: {
                    status: "COMPLETED",
                    completedAt: new Date(),
                },
            });

            await releaseEscrow(
                completedBooking.teacherId,
                completedBooking.fee,
                completedBooking.id
            );

            return NextResponse.json(completedBooking);
        }

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error("Error confirming booking:", error);
        return NextResponse.json({ error: error.message || "Failed to confirm booking" }, { status: 400 });
    }
}
