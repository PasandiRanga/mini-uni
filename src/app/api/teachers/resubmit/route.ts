export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { computeProfileCompletion } from "@/lib/teacherVerification";
import { notifyAdminsOfSubmission } from "@/lib/adminAlerts";

/**
 * Sends a rejected teacher profile back for review. Rejection is sticky —
 * editing details doesn't change the status — so the teacher says when
 * they're done, and the profile returns to the admin's PENDING queue.
 */
export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session || !session.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const profile = await prisma.teacherProfile.findUnique({
      where: { userId: session.sub },
      include: { verificationDocs: true },
    });
    if (!profile) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }
    if (profile.verificationStatus !== "REJECTED") {
      return NextResponse.json({ error: "Only a profile that needs changes can be resubmitted" }, { status: 400 });
    }
    if (!computeProfileCompletion(profile).complete) {
      return NextResponse.json({ error: "Complete every step before resubmitting" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.teacherProfile.update({
        where: { id: profile.id },
        data: { verificationStatus: "PENDING" },
      }),
      // Fresh review: the old decision no longer applies to the updated documents.
      prisma.verificationDocument.updateMany({
        where: { teacherId: profile.id },
        data: { status: "PENDING", rejectionReason: null, reviewedBy: null, reviewedAt: null },
      }),
    ]);

    await notifyAdminsOfSubmission({ teacherUserId: session.sub, resubmitted: true, origin: new URL(request.url).origin });

    return NextResponse.json({ ok: true, verificationStatus: "PENDING" });
  } catch (error) {
    console.error("Error resubmitting teacher profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
