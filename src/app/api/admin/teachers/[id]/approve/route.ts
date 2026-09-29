export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminAuth";
import { createNotification } from "@/lib/notifications";
import { sendEmail, buildVerificationStatusEmail } from "@/lib/email";

/**
 * Approves a teacher: marks the profile APPROVED and stamps every uploaded
 * document as reviewed/approved. Approval is what lets a teacher go live —
 * post classes, get booked, and earn. Keyed by user id.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
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

    const reviewedAt = new Date();

    await prisma.$transaction([
      prisma.teacherProfile.update({
        where: { id: profile.id },
        data: { verificationStatus: "APPROVED" },
      }),
      prisma.verificationDocument.updateMany({
        where: { teacherId: profile.id },
        data: {
          status: "APPROVED",
          reviewedBy: session.sub,
          reviewedAt,
          rejectionReason: null,
        },
      }),
    ]);

    await createNotification({
      userId: profile.userId,
      type: "VERIFICATION_STATUS",
      title: "You're verified!",
      message:
        "Your teacher profile has been approved. You can now post classes and start getting booked.",
      metadata: { status: "APPROVED" },
    });

    // Email too — best-effort, never block the decision on it.
    if (profile.user?.email) {
      const mail = buildVerificationStatusEmail("APPROVED", profile.user.firstName);
      sendEmail({ to: profile.user.email, ...mail }).catch((e) =>
        console.error("Failed to send approval email:", e)
      );
    }

    return NextResponse.json({ ok: true, verificationStatus: "APPROVED" });
  } catch (error) {
    console.error("Error approving teacher:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
