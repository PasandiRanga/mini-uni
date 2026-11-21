import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { DISPUTE_WINDOW_HOURS, DISPUTE_WINDOW_MS } from "@/lib/disputeReasons";

/** The teacher reports that the student didn't join the class. */
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await getSessionFromRequest(request);
    if (!session?.sub) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const bookingId = params.id;

        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                timeSlot: { select: { endTime: true } },
                inquiry: { select: { post: { select: { title: true, subject: true } } } },
                walletTransactions: { where: { type: "RELEASE" }, select: { id: true } },
            },
        });
        if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        if (booking.teacherId !== session.sub) {
            return NextResponse.json({ error: "Not authorized for this booking" }, { status: 403 });
        }
        if (booking.status === "DISPUTED" || booking.status === "CANCELLED" || booking.settlementOutcome) {
            return NextResponse.json({ error: "This class has already been settled" }, { status: 400 });
        }
        if (booking.walletTransactions.length) {
            return NextResponse.json({ error: "This class has already been paid out" }, { status: 400 });
        }
        const end = booking.timeSlot.endTime.getTime();
        if (end > Date.now()) {
            return NextResponse.json({ error: "The class hasn't ended yet" }, { status: 400 });
        }
        if (Date.now() > end + DISPUTE_WINDOW_MS) {
            return NextResponse.json({ error: "The reporting window has closed" }, { status: 400 });
        }

        const updated = await prisma.booking.update({
            where: { id: bookingId },
            data: { teacherMarkedAbsent: true, teacherConfirmed: false },
        });

        // Give the student a chance to contest: if they confirm or report, it
        // becomes a conflict for an admin instead of an automatic no-show.
        const title = booking.inquiry?.post?.title || booking.inquiry?.post?.subject || "your class";
        await createNotification({
            userId: booking.studentId,
            type: "CLASS_COMPLETION",
            title: "Your teacher marked you absent",
            message: `Your teacher reported that you didn't join "${title}". If that's wrong, confirm the class or report a problem within ${DISPUTE_WINDOW_HOURS} hours, or a ${10}% absence fee applies.`,
            metadata: { bookingId },
        });

        return NextResponse.json({ ok: true, teacherMarkedAbsent: updated.teacherMarkedAbsent });
    } catch (error: unknown) {
        console.error("Error marking student absent:", error);
        return NextResponse.json({ error: "Failed to mark the student as a no-show" }, { status: 400 });
    }
}
