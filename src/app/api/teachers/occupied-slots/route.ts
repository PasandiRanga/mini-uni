export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { BookingStatus } from "@prisma/client";

/**
 * GET — time ranges the teacher is already committed to, so the slot picker can
 * render them as disabled. Sourced from confirmed/in-progress bookings.
 */
export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || !session.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookings = await prisma.booking.findMany({
      where: {
        teacherId: session.sub,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS] },
      },
      select: {
        id: true,
        timeSlot: { select: { startTime: true, endTime: true } },
        inquiry: { select: { post: { select: { title: true, subject: true } } } },
      },
    });

    const slots = bookings
      .filter((b) => b.timeSlot?.startTime && b.timeSlot?.endTime)
      .map((b) => ({
        id: b.id,
        start: b.timeSlot!.startTime,
        end: b.timeSlot!.endTime,
        title: b.inquiry?.post?.title || b.inquiry?.post?.subject || "Booked",
      }));

    return NextResponse.json(slots);
  } catch (error) {
    console.error("Error fetching occupied slots:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
