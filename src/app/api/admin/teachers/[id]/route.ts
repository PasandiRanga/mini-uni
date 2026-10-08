export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminAuth";
import { computeProfileCompletion } from "@/lib/teacherVerification";
import { OPEN_BOOKING_STATUSES } from "@/lib/bookings";

/**
 * Full detail for one teacher under review — everything an admin needs to make
 * a decision: personal details, identity, academic background, and the
 * uploaded verification documents (with their URLs). Keyed by user id.
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const profile = await prisma.teacherProfile.findUnique({
      where: { userId: params.id },
      include: {
        verificationDocs: { orderBy: { createdAt: "asc" } },
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true, createdAt: true },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const { percent, complete, steps } = computeProfileCompletion(profile);
    // Shown when suspending: how many booked classes would be cancelled and refunded.
    const upcomingBookings = await prisma.booking.count({
      where: {
        teacherId: profile.userId,
        status: { in: [...OPEN_BOOKING_STATUSES] },
        timeSlot: { startTime: { gt: new Date() } },
      },
    });

    return NextResponse.json({
      userId: profile.userId,
      profileId: profile.id,
      user: profile.user,
      verificationStatus: profile.verificationStatus,
      suspensionReason: profile.suspensionReason,
      upcomingBookings,
      completion: percent,
      complete,
      steps,
      personal: {
        fullName: profile.fullName,
        nameWithInitials: profile.nameWithInitials,
        contactNumber: profile.contactNumber,
        contactNumber2: profile.contactNumber2,
        address: profile.address,
        country: profile.country,
        postalCode: profile.postalCode,
      },
      identity: {
        idType: profile.idType,
      },
      academic: {
        employmentStatus: profile.employmentStatus,
        universityName: profile.universityName,
        universityCountry: profile.universityCountry,
        stream: profile.stream,
        examYear: profile.examYear,
        workingStatus: profile.workingStatus,
        profession: profile.profession,
        employer: profile.employer,
      },
      teaching: {
        bio: profile.bio,
        experience: profile.experience,
        subjects: profile.subjects,
        hourlyRate: profile.hourlyRate,
      },
      documents: profile.verificationDocs.map((d) => ({
        id: d.id,
        documentType: d.documentType,
        documentUrl: d.documentUrl,
        status: d.status,
        rejectionReason: d.rejectionReason,
        reviewedAt: d.reviewedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching teacher detail:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
