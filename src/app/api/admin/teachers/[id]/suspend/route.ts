export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminAuth";
import { createNotification } from "@/lib/notifications";
import { sendEmail, buildSuspensionEmail } from "@/lib/email";
import { cancelBooking, OPEN_BOOKING_STATUSES } from "@/lib/bookings";

/**
 * Suspends an approved teacher. Their classes and public profile disappear,
 * and they can't post, respond or be booked (everything checks for APPROVED).
 * They can still sign in and withdraw what they've earned.
 *
 * With `cancelUpcoming`, every booked class that hasn't started is cancelled
 * and the student refunded. Classes already paid out to the teacher can't be
 * reversed and are reported back as `notCancelled`. Keyed by user id.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 1000) : "";
    const cancelUpcoming = body?.cancelUpcoming !== false;
    if (!reason) {
      return NextResponse.json({ error: "A reason is required to suspend" }, { status: 400 });
    }

    const profile = await prisma.teacherProfile.findUnique({
      where: { userId: params.id },
      select: { id: true, userId: true, verificationStatus: true, user: { select: { email: true, firstName: true, lastName: true, notifyEmail: true } } },
    });
    if (!profile) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }
    if (profile.verificationStatus !== "APPROVED") {
      return NextResponse.json(
        { error: `Only an approved teacher can be suspended (this one is ${profile.verificationStatus.toLowerCase()})`, code: "NOT_APPROVED" },
        { status: 409 }
      );
    }

    // Suspend first, so no new booking can slip in while classes are being cancelled.
    await prisma.teacherProfile.update({
      where: { id: profile.id },
      data: { verificationStatus: "SUSPENDED", suspensionReason: reason },
    });

    let cancelled = 0;
    let notCancelled = 0;
    if (cancelUpcoming) {
      const upcoming = await prisma.booking.findMany({
        where: {
          teacherId: profile.userId,
          status: { in: [...OPEN_BOOKING_STATUSES] },
          timeSlot: { startTime: { gt: new Date() } },
        },
        select: { id: true, studentId: true },
      });
      const teacherName = `${profile.user.firstName} ${profile.user.lastName}`.trim();
      for (const b of upcoming) {
        try {
          const { refunded } = await cancelBooking(b.id, "The teacher is no longer available");
          cancelled++;
          await createNotification({
            userId: b.studentId,
            type: "BOOKING_CANCELLED",
            title: "Class cancelled",
            message: `Your class with ${teacherName} was cancelled because they're no longer available.${refunded ? " You've been refunded to your wallet." : ""}`,
            metadata: { bookingId: b.id, refunded },
          });
        } catch (err) {
          notCancelled++;
          console.error(`Couldn't cancel booking ${b.id} while suspending a teacher:`, err);
        }
      }
    }

    await createNotification({
      userId: profile.userId,
      type: "VERIFICATION_STATUS",
      title: "Your teaching account is suspended",
      message: `Reason: ${reason} Your classes are hidden and you can't take new bookings. Contact support if you have questions.`,
      metadata: { status: "SUSPENDED", reason },
    });
    if (profile.user.email && profile.user.notifyEmail !== false) {
      const mail = buildSuspensionEmail("SUSPENDED", profile.user.firstName, reason, cancelled);
      sendEmail({ to: profile.user.email, ...mail }).catch((e) => console.error("Failed to send suspension email:", e));
    }

    return NextResponse.json({ ok: true, verificationStatus: "SUSPENDED", cancelled, notCancelled });
  } catch (error) {
    console.error("Error suspending teacher:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
