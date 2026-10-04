import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { SeatError, bookableClassTypes, claimSeat, feeFor, seatErrorMessage } from "@/lib/seats";
import type { ClassType } from "@prisma/client";

export async function POST(request: Request) {
    const session = await getSessionFromRequest(request);
    if (!session || !session.sub) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { inquiryId, classType: requestedType } = await request.json();

        const inquiry = await prisma.inquiry.findUnique({
            where: { id: inquiryId },
            include: {
                timeSlots: true,
                post: true,
            },
        });

        if (!inquiry) {
            return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
        }
        if (inquiry.status !== "ACCEPTED") {
            return NextResponse.json({ error: "Inquiry must be accepted by teacher before booking" }, { status: 400 });
        }

        const timeSlot = inquiry.timeSlots[0];
        if (!timeSlot) {
            return NextResponse.json({ error: "No time slot selected for this inquiry" }, { status: 400 });
        }

        if (timeSlot.status === "BOOKED") {
            return NextResponse.json({ error: "Time slot is already booked" }, { status: 400 });
        }

        const offered = bookableClassTypes(inquiry.post);
        const classType: ClassType = requestedType ?? offered[0];
        if (!offered.includes(classType)) {
            return NextResponse.json({ error: "This class isn't offered as that type" }, { status: 400 });
        }

        const booking = await prisma.$transaction(async (tx) => {
            await claimSeat(tx, {
                slotId: timeSlot.id,
                studentId: inquiry.senderId,
                classType,
                post: inquiry.post,
            });
            return tx.booking.create({
                data: {
                    inquiryId: inquiry.id,
                    studentId: inquiry.senderId,
                    teacherId: inquiry.receiverId,
                    timeSlotId: timeSlot.id,
                    status: "PENDING_PAYMENT",
                    classType,
                    fee: feeFor(inquiry.post, classType),
                },
            });
        });

        return NextResponse.json(booking, { status: 201 });
    } catch (error: any) {
        if (error instanceof SeatError) {
            return NextResponse.json({ error: seatErrorMessage(error.message) }, { status: 409 });
        }
        console.error("Error creating booking:", error);
        return NextResponse.json({ error: error.message || "Failed to create booking" }, { status: 400 });
    }
}
