import prisma from "./prisma";
import { createNotification } from "./notifications";
import { buildNoticeEmail, sendEmail } from "./email";
import { refundBookingToStudent, releaseBookingEscrow } from "./wallet";
import { DISPUTE_REASONS, type DisputeReason, withinDisputeWindow } from "./disputeReasons";

/** Booking states a student can report from: paid, and not already settled. */
const REPORTABLE_STATUSES = ["PAYMENT_COMPLETED", "CONFIRMED", "IN_PROGRESS", "COMPLETED"] as const;

export const MAX_DISPUTE_TEXT = 2000;

const classTitle = (b: { inquiry?: { post?: { title?: string | null; subject?: string | null } | null } | null }) =>
  b.inquiry?.post?.title || b.inquiry?.post?.subject || "your class";

/** Emails one user if they allow it. Best-effort: a failed email never fails the action. */
async function emailUser(userId: string, mail: ReturnType<typeof buildNoticeEmail>) {
  try {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, notifyEmail: true } });
    if (u?.email && u.notifyEmail !== false) await sendEmail({ to: u.email, ...mail });
  } catch (err) {
    console.error("Failed to send dispute email:", err);
  }
}

/**
 * Whether the student can still report this booking: it's theirs, it has
 * started, the report window is open, it hasn't been reported, and the
 * teacher hasn't been paid yet.
 */
export async function canReportBooking(bookingId: string, studentId: string) {
  const b = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      studentId: true,
      status: true,
      dispute: { select: { id: true } },
      timeSlot: { select: { startTime: true, endTime: true } },
      walletTransactions: { where: { type: "RELEASE" }, select: { id: true } },
    },
  });
  if (!b || b.studentId !== studentId) return { ok: false as const, error: "NOT_FOUND" };
  if (b.dispute) return { ok: false as const, error: "ALREADY_REPORTED" };
  if (!(REPORTABLE_STATUSES as readonly string[]).includes(b.status)) return { ok: false as const, error: "NOT_REPORTABLE" };
  if (!withinDisputeWindow(b.timeSlot.startTime, b.timeSlot.endTime)) return { ok: false as const, error: "WINDOW_CLOSED" };
  if (b.walletTransactions.length) return { ok: false as const, error: "ALREADY_SETTLED" };
  return { ok: true as const };
}

/** Student reports a problem. The booking becomes DISPUTED, which holds the teacher's payout. */
export async function openDispute(opts: { bookingId: string; studentId: string; reason: DisputeReason; details: string; origin: string }) {
  const check = await canReportBooking(opts.bookingId, opts.studentId);
  if (!check.ok) throw new Error(check.error);

  const dispute = await prisma.$transaction(async (tx) => {
    // Guarded on the current status so a class being completed at the same moment can't slip through.
    const { count } = await tx.booking.updateMany({
      where: { id: opts.bookingId, status: { in: [...REPORTABLE_STATUSES] } },
      data: { status: "DISPUTED" },
    });
    if (count !== 1) throw new Error("NOT_REPORTABLE");
    return tx.dispute.create({
      data: { bookingId: opts.bookingId, reportedById: opts.studentId, reason: opts.reason, details: opts.details },
    });
  });

  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: opts.bookingId },
    select: {
      teacherId: true,
      student: { select: { firstName: true, lastName: true } },
      inquiry: { select: { post: { select: { title: true, subject: true } } } },
    },
  });
  const title = classTitle(booking);
  const reasonText = DISPUTE_REASONS[opts.reason];
  const studentName = `${booking.student.firstName} ${booking.student.lastName}`.trim();

  // The teacher: their payout is paused and they can give their side.
  await createNotification({
    userId: booking.teacherId,
    type: "CLASS_COMPLETION",
    title: "A student reported a problem",
    message: `"${title}": ${reasonText}. The payment is on hold while we review it. Add your side from My Classes.`,
    metadata: { bookingId: opts.bookingId, disputeId: dispute.id },
  });
  await emailUser(
    booking.teacherId,
    buildNoticeEmail({
      subject: "A student reported a problem with your class",
      heading: "A class was reported",
      body: `${studentName} reported a problem with "${title}": ${reasonText}.\n\nThe payment for this class is on hold while MiniUni reviews it. You can add your side of the story from My Classes.`,
      link: `${opts.origin}/teacher/dashboard`,
      cta: "Open My Classes",
    })
  );

  // Every admin: there's something to review.
  const admins = await prisma.user.findMany({ where: { role: "ADMIN", isActive: true }, select: { id: true } });
  const adminMail = buildNoticeEmail({
    subject: `Class reported: ${reasonText}`,
    heading: "A class needs review",
    body: `${studentName} reported "${title}": ${reasonText}.\n\n"${opts.details}"`,
    link: `${opts.origin}/admin`,
    cta: "Open the disputes queue",
  });
  await Promise.all(
    admins.map(async (a) => {
      await createNotification({
        userId: a.id,
        type: "CLASS_COMPLETION",
        title: "A class was reported",
        message: `${studentName}: ${reasonText} ("${title}")`,
        metadata: { bookingId: opts.bookingId, disputeId: dispute.id },
      });
      await emailUser(a.id, adminMail);
    })
  );

  return dispute;
}

/** The teacher adds (or edits) their side while the dispute is open. */
export async function respondToDispute(bookingId: string, teacherId: string, response: string) {
  const dispute = await prisma.dispute.findUnique({
    where: { bookingId },
    select: { id: true, status: true, booking: { select: { teacherId: true } } },
  });
  if (!dispute || dispute.booking.teacherId !== teacherId) throw new Error("NOT_FOUND");
  if (dispute.status !== "OPEN") throw new Error("ALREADY_RESOLVED");
  return prisma.dispute.update({ where: { id: dispute.id }, data: { teacherResponse: response } });
}

/**
 * Admin settles a dispute: "refund" returns the money to the student's wallet
 * and cancels the booking; "release" pays the teacher as normal.
 */
export async function resolveDispute(disputeId: string, action: "refund" | "release", note: string, origin: string) {
  const status = action === "refund" ? "REFUNDED" : "RELEASED";

  // Claim it first, so two admins clicking at once can't both act.
  const { count } = await prisma.dispute.updateMany({
    where: { id: disputeId, status: "OPEN" },
    data: { status, resolutionNote: note || null, resolvedAt: new Date() },
  });
  if (count !== 1) throw new Error("ALREADY_RESOLVED");

  const dispute = await prisma.dispute.findUniqueOrThrow({
    where: { id: disputeId },
    select: {
      bookingId: true,
      booking: {
        select: {
          studentId: true,
          teacherId: true,
          inquiry: { select: { post: { select: { title: true, subject: true } } } },
        },
      },
    },
  });
  const { bookingId, booking } = dispute;

  try {
    if (action === "refund") {
      await refundBookingToStudent(bookingId, "refunded after a reported problem");
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: "CANCELLED", cancelledAt: new Date(), cancellationReason: "Refunded after a reported problem" },
      });
    } else {
      await prisma.booking.update({ where: { id: bookingId }, data: { status: "COMPLETED", completedAt: new Date() } });
      await releaseBookingEscrow(bookingId);
    }
  } catch (err) {
    // Put it back in the queue so it can be retried.
    await prisma.dispute.update({ where: { id: disputeId }, data: { status: "OPEN", resolutionNote: null, resolvedAt: null } });
    throw err;
  }

  const title = classTitle(booking);
  const noteLine = note ? `\n\nNote from MiniUni: ${note}` : "";
  const outcomes =
    action === "refund"
      ? {
          student: { title: "You've been refunded", message: `We reviewed your report on "${title}" and refunded the class to your wallet.` },
          teacher: { title: "Report upheld", message: `We reviewed the report on "${title}" and refunded the student. This class won't be paid.` },
        }
      : {
          student: { title: "Report reviewed", message: `We reviewed your report on "${title}" and found the class went ahead, so the teacher has been paid.` },
          teacher: { title: "Payment released", message: `We reviewed the report on "${title}" and released your payment.` },
        };

  for (const [userId, o, path] of [
    [booking.studentId, outcomes.student, "/student/dashboard"],
    [booking.teacherId, outcomes.teacher, "/teacher/dashboard"],
  ] as const) {
    await createNotification({
      userId,
      type: "CLASS_COMPLETION",
      title: o.title,
      message: o.message + (note ? ` Note: ${note}` : ""),
      metadata: { bookingId, disputeId },
    });
    await emailUser(userId, buildNoticeEmail({ subject: o.title, heading: o.title, body: o.message + noteLine, link: `${origin}${path}`, cta: "Open MiniUni" }));
  }
}

/** Disputes for the admin queue, newest first. */
export async function getDisputesForAdmin(scope: "open" | "resolved") {
  const rows = await prisma.dispute.findMany({
    where: scope === "open" ? { status: "OPEN" } : { status: { not: "OPEN" } },
    orderBy: { createdAt: scope === "open" ? "asc" : "desc" },
    take: 100,
    select: {
      id: true,
      reason: true,
      details: true,
      teacherResponse: true,
      status: true,
      resolutionNote: true,
      resolvedAt: true,
      createdAt: true,
      booking: {
        select: {
          id: true,
          fee: true,
          classType: true,
          payment: { select: { currency: true } },
          timeSlot: { select: { startTime: true, endTime: true } },
          student: { select: { id: true, firstName: true, lastName: true, email: true } },
          teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
          inquiry: { select: { post: { select: { title: true, subject: true } } } },
        },
      },
    },
  });
  return rows.map(({ booking, ...d }) => ({
    ...d,
    bookingId: booking.id,
    amount: booking.fee,
    currency: booking.payment?.currency ?? "LKR",
    classType: booking.classType,
    title: classTitle(booking),
    startTime: booking.timeSlot.startTime,
    endTime: booking.timeSlot.endTime,
    student: booking.student,
    teacher: booking.teacher,
  }));
}
