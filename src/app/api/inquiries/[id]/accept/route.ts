export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { getWalletForUser, payBookingFromWallet } from "@/lib/wallet";
import { createNotification } from "@/lib/notifications";

/**
 * The student accepts a teacher's offer on their request: this books the class
 * and pays for it from the student's wallet (escrow hold + Meet link), exactly
 * like booking a teacher's own class. For a student request the inquiry's
 * receiver is the student (post owner) and the sender is the teacher.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
    const session = await getSessionFromRequest(request);
    if (!session?.sub) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.sub;

    try {
        const inquiry = await prisma.inquiry.findUnique({
            where: { id: params.id },
            include: { post: { select: { type: true, title: true } }, booking: { select: { id: true } } },
        });
        if (!inquiry) return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
        if (inquiry.post.type !== "STUDENT_REQUEST") {
            return NextResponse.json({ error: "This isn't a request offer" }, { status: 400 });
        }
        if (inquiry.receiverId !== userId) {
            return NextResponse.json({ error: "Only the student can accept this offer" }, { status: 403 });
        }
        if (inquiry.booking) {
            return NextResponse.json({ error: "This offer has already been booked" }, { status: 409 });
        }
        if (inquiry.status !== "PENDING") {
            return NextResponse.json({ error: `This was already ${inquiry.status.toLowerCase()}` }, { status: 409 });
        }
        if (!inquiry.proposedFee || !inquiry.proposedStartTime || !inquiry.proposedEndTime) {
            return NextResponse.json({ error: "This response has no bookable offer" }, { status: 400 });
        }
        if (inquiry.proposedStartTime.getTime() <= Date.now()) {
            return NextResponse.json({ error: "The proposed time has already passed. Ask the teacher to suggest a new time." }, { status: 400 });
        }

        const student = await prisma.user.findUnique({ where: { id: userId }, select: { emailVerified: true } });
        if (!student?.emailVerified) {
            return NextResponse.json({ error: "Verify your email before booking.", code: "EMAIL_NOT_VERIFIED" }, { status: 403 });
        }

        const fee = new Prisma.Decimal(inquiry.proposedFee);
        const wallet = await getWalletForUser(userId);
        if (new Prisma.Decimal(wallet.releasedBalance).lt(fee)) {
            const shortfall = fee.sub(wallet.releasedBalance);
            return NextResponse.json(
                { error: "Your wallet balance doesn't cover this class.", code: "INSUFFICIENT_FUNDS", shortfall: shortfall.toNumber() },
                { status: 400 }
            );
        }

        // Create a dedicated slot + booking for this offer, then mark it accepted.
        const booking = await prisma.$transaction(async (tx) => {
            const slot = await tx.timeSlot.create({
                data: {
                    inquiryId: inquiry.id,
                    startTime: inquiry.proposedStartTime!,
                    endTime: inquiry.proposedEndTime!,
                    status: "BOOKED",
                    bookedAs: "INDIVIDUAL",
                },
            });
            const created = await tx.booking.create({
                data: {
                    inquiryId: inquiry.id,
                    studentId: inquiry.receiverId, // the student (post owner)
                    teacherId: inquiry.senderId,   // the teacher who offered
                    timeSlotId: slot.id,
                    status: "PENDING_PAYMENT",
                    classType: "INDIVIDUAL",
                    fee,
                },
            });
            await tx.inquiry.update({ where: { id: inquiry.id }, data: { status: "ACCEPTED" } });
            return created;
        });

        // Charge the wallet, hold it in escrow, confirm, and add the Meet link.
        try {
            await payBookingFromWallet(userId, booking.id, new URL(request.url).origin);
        } catch (err: any) {
            // Roll back the booking so a failed charge doesn't leave a dangling class.
            await prisma.booking.delete({ where: { id: booking.id } }).catch(() => {});
            await prisma.timeSlot.delete({ where: { id: booking.timeSlotId } }).catch(() => {});
            await prisma.inquiry.update({ where: { id: inquiry.id }, data: { status: "PENDING" } }).catch(() => {});
            if (err?.message === "INSUFFICIENT_FUNDS") {
                return NextResponse.json({ error: "Your wallet balance doesn't cover this class.", code: "INSUFFICIENT_FUNDS" }, { status: 400 });
            }
            throw err;
        }

        await createNotification({
            userId: inquiry.senderId,
            type: "SLOT_CONFIRMED",
            title: "Your offer was booked",
            message: `Your offer on "${inquiry.post.title}" was accepted and paid. Find the class in My Classes.`,
            metadata: { bookingId: booking.id, inquiryId: inquiry.id },
        });

        return NextResponse.json({ bookingId: booking.id });
    } catch (error: any) {
        console.error("Error accepting request offer:", error);
        return NextResponse.json({ error: error.message || "Couldn't accept the offer" }, { status: 400 });
    }
}
