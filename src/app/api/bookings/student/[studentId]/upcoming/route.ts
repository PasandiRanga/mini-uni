import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSelfOrAdmin } from "@/lib/adminAuth";
import { settleFinishedBookings } from "@/lib/bookings";
import { withinDisputeWindow } from "@/lib/disputeReasons";

const REPORTABLE = ["PAYMENT_COMPLETED", "CONFIRMED", "IN_PROGRESS", "COMPLETED"];

export async function GET(
    request: Request,
    { params }: { params: { studentId: string } }
) {
    const auth = await requireSelfOrAdmin(request, params.studentId);
    if (auth.error) return auth.error;

    try {
        const { studentId } = params;
        // Finished classes become COMPLETED before they're listed.
        await settleFinishedBookings({ studentId });
        // ?scope=all returns finished and cancelled classes too, for history
        // views and stats. The default stays limited to active bookings.
        const all = new URL(request.url).searchParams.get("scope") === "all";

        const bookings = await prisma.booking.findMany({
            where: {
                studentId,
                ...(all ? {} : { status: { notIn: ["CANCELLED", "COMPLETED"] } }),
            },
            include: {
                teacher: { select: { id: true, firstName: true, lastName: true } },
                timeSlot: { select: { startTime: true, endTime: true } },
                inquiry: { include: { post: { select: { title: true, subject: true } } } },
                review: { select: { rating: true, comment: true } },
                dispute: { select: { reason: true, details: true, status: true, teacherResponse: true, resolutionNote: true, createdAt: true } },
                // Only to tell whether the teacher has been paid yet.
                walletTransactions: { where: { type: "RELEASE" }, select: { id: true } },
            },
            orderBy: { createdAt: "desc" },
            take: all ? 100 : 20,
        });

        return NextResponse.json(
            bookings.map(({ walletTransactions, ...b }) => ({
                ...b,
                // Mirrors canReportBooking, so the button only shows when the report will be accepted.
                canReport:
                    !b.dispute &&
                    REPORTABLE.includes(b.status) &&
                    walletTransactions.length === 0 &&
                    withinDisputeWindow(b.timeSlot.startTime, b.timeSlot.endTime),
            }))
        );
    } catch (error) {
        console.error("Error fetching student bookings:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
