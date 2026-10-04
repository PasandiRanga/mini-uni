export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { SeatError, bookableClassTypes, claimSeat, feeFor, seatErrorMessage } from "@/lib/seats";
import type { ClassType } from "@prisma/client";

/**
 * Direct booking of a teacher's class offering (no prior inquiry needed).
 * Creates a synthetic ACCEPTED inquiry (Booking.inquiryId is required), a
 * PENDING_PAYMENT booking, and claims a seat on the chosen slot. The caller
 * then pays via POST /api/payments/wallet.
 *
 * `classType` picks Individual or Group when the post offers both; it defaults
 * to the only type on offer. An individual booking takes the whole slot, while
 * group bookings share it up to the post's max students (see lib/seats).
 */
export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session || !session.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { postId, timeSlotId, classType: requestedType } = await request.json();
    if (!postId || !timeSlotId) {
      return NextResponse.json({ error: "postId and timeSlotId are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { id: true, emailVerified: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Gate: verified email required before booking/paying.
    if (!user.emailVerified) {
      return NextResponse.json({ error: "EMAIL_NOT_VERIFIED" }, { status: 403 });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { timeSlots: true, user: { select: { teacherProfile: { select: { verificationStatus: true } } } } },
    });
    if (
      !post ||
      post.type !== "TEACHER_OFFERING" ||
      !post.isActive ||
      post.user.teacherProfile?.verificationStatus !== "APPROVED"
    ) {
      return NextResponse.json({ error: "This class is not available for booking" }, { status: 400 });
    }
    if (post.userId === user.id) {
      return NextResponse.json({ error: "You can't book your own class" }, { status: 400 });
    }

    const slot = post.timeSlots.find((s) => s.id === timeSlotId);
    if (!slot) {
      return NextResponse.json({ error: "That time slot doesn't belong to this class" }, { status: 400 });
    }
    if (slot.status !== "AVAILABLE") {
      return NextResponse.json({ error: "That time slot is no longer available" }, { status: 409 });
    }

    const offered = bookableClassTypes(post);
    const classType: ClassType = requestedType ?? offered[0];
    if (!offered.includes(classType)) {
      return NextResponse.json({ error: "This class isn't offered as that type" }, { status: 400 });
    }
    if (new Date(slot.startTime).getTime() <= Date.now()) {
      return NextResponse.json({ error: "That time slot has already started" }, { status: 400 });
    }

    const booking = await prisma.$transaction(async (tx) => {
      // Locks the slot, so a concurrent booking can't take the same seat.
      await claimSeat(tx, { slotId: slot.id, studentId: user.id, classType, post });

      const inquiry = await tx.inquiry.create({
        data: {
          postId: post.id,
          senderId: user.id,
          receiverId: post.userId,
          message: "Booked directly from the class post.",
          status: "ACCEPTED",
          timeSlots: { connect: { id: slot.id } },
        },
      });

      return tx.booking.create({
        data: {
          inquiryId: inquiry.id,
          studentId: user.id,
          teacherId: post.userId,
          timeSlotId: slot.id,
          status: "PENDING_PAYMENT",
          classType,
          fee: feeFor(post, classType),
        },
      });
    });

    return NextResponse.json({ bookingId: booking.id, fee: booking.fee, classType }, { status: 201 });
  } catch (error: any) {
    if (error instanceof SeatError) {
      return NextResponse.json({ error: seatErrorMessage(error.message) }, { status: 409 });
    }
    console.error("Error creating direct booking:", error);
    return NextResponse.json({ error: error.message || "Failed to book" }, { status: 400 });
  }
}
