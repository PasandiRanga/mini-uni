export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

/**
 * Direct booking of a teacher's class offering (no prior inquiry needed).
 * Creates a synthetic ACCEPTED inquiry (Booking.inquiryId is required), a
 * PENDING_PAYMENT booking, and marks the chosen slot BOOKED. The caller then
 * pays via POST /api/payments/wallet.
 *
 * Note: one booking per time slot (Booking.timeSlotId is unique), so this
 * covers individual classes. Group/mass multi-student slots need the separate
 * schema rework.
 */
export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session || !session.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { postId, timeSlotId } = await request.json();
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
      include: { timeSlots: true },
    });
    if (!post || post.type !== "TEACHER_OFFERING" || !post.isActive) {
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
    if (new Date(slot.startTime).getTime() <= Date.now()) {
      return NextResponse.json({ error: "That time slot has already started" }, { status: 400 });
    }

    const booking = await prisma.$transaction(async (tx) => {
      // Guard against a concurrent booking claiming the slot first.
      const claimed = await tx.timeSlot.updateMany({
        where: { id: slot.id, status: "AVAILABLE" },
        data: { status: "BOOKED" },
      });
      if (claimed.count === 0) throw new Error("SLOT_TAKEN");

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
          fee: post.fee ?? 0,
        },
      });
    });

    return NextResponse.json({ bookingId: booking.id, fee: booking.fee }, { status: 201 });
  } catch (error: any) {
    if (error?.message === "SLOT_TAKEN") {
      return NextResponse.json({ error: "That time slot was just booked by someone else" }, { status: 409 });
    }
    console.error("Error creating direct booking:", error);
    return NextResponse.json({ error: error.message || "Failed to book" }, { status: 400 });
  }
}
