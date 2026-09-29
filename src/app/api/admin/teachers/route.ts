export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { VerificationStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminAuth";
import { computeProfileCompletion } from "@/lib/teacherVerification";

/**
 * Admin review queue. By default returns teacher profiles awaiting review —
 * PENDING and 100% complete, the ones an admin can actually act on. Pass
 * ?status=APPROVED|REJECTED|ALL to review history instead (no completeness
 * filter for those).
 */
export async function GET(request: Request) {
  const session = await getAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const statusParam = (searchParams.get("status") || "PENDING").toUpperCase();

    const where =
      statusParam === "ALL"
        ? {}
        : { verificationStatus: statusParam as VerificationStatus };

    const profiles = await prisma.teacherProfile.findMany({
      where,
      include: {
        verificationDocs: true,
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true, createdAt: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const items = profiles
      .map((p) => {
        const { percent, complete } = computeProfileCompletion(p);
        return {
          userId: p.userId,
          profileId: p.id,
          name: `${p.user.firstName} ${p.user.lastName}`.trim(),
          fullName: p.fullName || null,
          email: p.user.email,
          phone: p.user.phone || p.contactNumber || null,
          subjects: p.subjects,
          employmentStatus: p.employmentStatus,
          verificationStatus: p.verificationStatus,
          completion: percent,
          complete,
          documentCount: p.verificationDocs.length,
          submittedAt: p.updatedAt,
          joinedAt: p.user.createdAt,
        };
      })
      // Only surface actionable (100%-complete) profiles in the pending queue.
      .filter((item) => (statusParam === "PENDING" ? item.complete : true));

    return NextResponse.json({ items, count: items.length });
  } catch (error) {
    console.error("Error listing teachers for review:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
