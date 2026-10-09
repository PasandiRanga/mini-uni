export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

const MAX_COMMENT = 1000;

/**
 * The student rates a completed class, 1–5 stars with an optional comment.
 * Posting again edits the existing review.
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
        const booking = await prisma.booking.findUnique({
            where: { id: params.id },
            select: { id: true, studentId: true, teacherId: true, status: true, review: { select: { id: true } } },
        });
        if (!booking) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }
        if (booking.studentId !== session.sub) {
            return NextResponse.json({ error: "Only the student who took this class can rate it" }, { status: 403 });
        }
        if (booking.status !== "COMPLETED") {
            return NextResponse.json({ error: "You can rate a class once it's completed" }, { status: 400 });
        }

        const body = await request.json().catch(() => ({}));
        const rating = Number(body?.rating);
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            return NextResponse.json({ error: "Pick a rating from 1 to 5 stars" }, { status: 400 });
        }
        const comment: string | null = body?.comment?.toString().trim().slice(0, MAX_COMMENT) || null;

        const review = await prisma.review.upsert({
            where: { bookingId: booking.id },
            create: { bookingId: booking.id, studentId: booking.studentId, teacherId: booking.teacherId, rating, comment },
            update: { rating, comment },
            select: { rating: true, comment: true },
        });

        // Tell the teacher about new reviews, not every edit.
        if (!booking.review) {
            await createNotification({
                userId: booking.teacherId,
                type: "CLASS_COMPLETION",
                title: "New review",
                message: `A student rated your class ${rating} star${rating === 1 ? "" : "s"}.`,
                metadata: { bookingId: booking.id, rating },
            });
        }

        return NextResponse.json(review);
    } catch (error) {
        console.error("Error saving review:", error);
        return NextResponse.json({ error: "Couldn't save your review" }, { status: 500 });
    }
}
