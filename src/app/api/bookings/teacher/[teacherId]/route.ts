import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSelfOrAdmin } from "@/lib/adminAuth";
import { settleFinishedBookings } from "@/lib/bookings";
import { backfillMeetLinks } from "@/lib/wallet";

export async function GET(
    request: Request,
    { params }: { params: { teacherId: string } }
) {
    const auth = await requireSelfOrAdmin(request, params.teacherId);
    if (auth.error) return auth.error;

    try {
        const { teacherId } = params;
        // Finished classes become COMPLETED (and pay out once the report window closes) before they're listed.
        await settleFinishedBookings({ teacherId });
        // Fill Meet links for classes booked before this teacher connected Google.
        await backfillMeetLinks({ teacherId });

        const bookings = await prisma.booking.findMany({
            where: { teacherId },
            include: {
                student: { select: { id: true, firstName: true, lastName: true } },
                timeSlot: { select: { startTime: true, endTime: true } },
                inquiry: { include: { post: { select: { title: true, subject: true } } } },
                dispute: { select: { reason: true, details: true, status: true, teacherResponse: true, resolutionNote: true, createdAt: true } },
                // Only to tell whether the teacher has been paid yet.
                walletTransactions: { where: { type: "RELEASE" }, select: { id: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        return NextResponse.json(
            bookings.map(({ walletTransactions, ...b }) => ({
                ...b,
                // The teacher can confirm a class that has ended, isn't disputed or
                // cancelled, hasn't paid out yet, and that they haven't confirmed.
                canConfirm:
                    !b.dispute &&
                    b.status !== "CANCELLED" &&
                    walletTransactions.length === 0 &&
                    b.timeSlot.endTime.getTime() <= Date.now() &&
                    !b.teacherConfirmed,
            }))
        );
    } catch (error) {
        console.error("Error fetching teacher bookings:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
