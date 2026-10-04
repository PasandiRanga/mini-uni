export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminAuth";
import { createNotification } from "@/lib/notifications";
import { sendEmail, buildVerificationStatusEmail } from "@/lib/email";

/**
 * Rejects a teacher with a reason. Marks the profile REJECTED and records the
 * reason on each document (the schema has no profile-level note field, so the
 * documents carry it) so the teacher can be told what to fix and re-submit.
 * Keyed by user id.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 1000) : "";

    if (!reason) {
      return NextResponse.json({ error: "A reason is required to reject" }, { status: 400 });
    }

    const profile = await prisma.teacherProfile.findUnique({
      where: { userId: params.id },
      select: {
        id: true,
        userId: true,
        verificationStatus: true,
        user: { select: { email: true, firstName: true } },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }
    if (profile.verificationStatus !== "PENDING") {
      return NextResponse.json(
        { error: `This teacher is already ${profile.verificationStatus.toLowerCase()}`, code: "NOT_PENDING" },
        { status: 409 }
      );
    }

    const reviewedAt = new Date();

    await prisma.$transaction([
      prisma.teacherProfile.update({
        where: { id: profile.id },
        data: { verificationStatus: "REJECTED" },
      }),
      prisma.verificationDocument.updateMany({
        where: { teacherId: profile.id },
        data: {
          status: "REJECTED",
          reviewedBy: session.sub,
          reviewedAt,
          rejectionReason: reason,
        },
      }),
    ]);

    await createNotification({
      userId: profile.userId,
      type: "VERIFICATION_STATUS",
      title: "Verification needs attention",
      message: `Your teacher profile wasn't approved: ${reason} Please update your details and re-submit.`,
      metadata: { status: "REJECTED", reason },
    });

    if (profile.user?.email) {
      const mail = buildVerificationStatusEmail("REJECTED", profile.user.firstName, reason);
      sendEmail({ to: profile.user.email, ...mail }).catch((e) =>
        console.error("Failed to send rejection email:", e)
      );
    }

    return NextResponse.json({ ok: true, verificationStatus: "REJECTED" });
  } catch (error) {
    console.error("Error rejecting teacher:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
