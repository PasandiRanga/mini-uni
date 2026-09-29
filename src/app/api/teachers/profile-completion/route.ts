export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { computeProfileCompletion } from "@/lib/teacherVerification";

/**
 * Computes how far a teacher's profile is completed across three steps:
 * personal details, identity verification, and academic/professional background.
 * Drives the dashboard "Complete your profile" banner and the wizard's progress bar.
 */
export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || !session.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      include: { teacherProfile: { include: { verificationDocs: true } } },
    });

    if (!user || !user.teacherProfile) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    const p = user.teacherProfile;
    const { percent, complete, steps } = computeProfileCompletion(p);

    // On rejection the admin's reason is stored on the documents — surface it
    // so the dashboard banner can tell the teacher what to fix.
    const rejectionReason =
      p.verificationStatus === "REJECTED"
        ? p.verificationDocs.find((d) => d.rejectionReason)?.rejectionReason ?? null
        : null;

    return NextResponse.json({
      percent,
      complete,
      steps,
      verificationStatus: p.verificationStatus,
      rejectionReason,
    });
  } catch (error) {
    console.error("Error computing profile completion:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
