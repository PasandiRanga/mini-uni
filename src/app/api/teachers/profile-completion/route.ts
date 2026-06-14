export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

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
    const has = (v: unknown) => typeof v === "string" && v.trim() !== "";
    const docTypes = p.verificationDocs.map((d) => d.documentType);

    // Step 1 — personal details
    const personalComplete =
      has(p.fullName) && has(p.nameWithInitials) && has(p.contactNumber) && has(p.address) && has(p.country) && has(p.postalCode);

    // Step 2 — identity: type chosen + required scans uploaded (back required for NIC/LICENSE)
    const needsBack = p.idType === "NIC" || p.idType === "LICENSE";
    const identityComplete =
      has(p.idType) && docTypes.includes("ID_FRONT") && (!needsBack || docTypes.includes("ID_BACK"));

    // Step 3 — academic/professional (conditional on employment status)
    let academicComplete = false;
    if (p.employmentStatus === "STUDENT" || p.employmentStatus === "UNDERGRADUATE") {
      academicComplete = has(p.universityName) && has(p.universityCountry);
    } else if (p.employmentStatus === "GRADUATE") {
      academicComplete = has(p.workingStatus) && has(p.profession) && has(p.employer);
    }

    const steps = [
      { key: "personal", label: "Personal details", complete: personalComplete },
      { key: "identity", label: "Identity verification", complete: identityComplete },
      { key: "academic", label: "Academic background", complete: academicComplete },
    ];

    const completeCount = steps.filter((s) => s.complete).length;
    const percent = Math.round((completeCount / steps.length) * 100);

    return NextResponse.json({
      percent,
      complete: percent === 100,
      steps,
      verificationStatus: p.verificationStatus,
    });
  } catch (error) {
    console.error("Error computing profile completion:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
