export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/** Public headline numbers for the landing page. Counts only, no personal data. */
export async function GET() {
  try {
    const [teachers, students, reviews, completedClasses] = await Promise.all([
      prisma.user.findMany({
        where: { role: "TEACHER", isActive: true, teacherProfile: { verificationStatus: "APPROVED" } },
        select: { firstName: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.user.count({ where: { role: "STUDENT", isActive: true } }),
      prisma.review.aggregate({ _avg: { rating: true }, _count: { _all: true } }),
      prisma.booking.count({ where: { status: "COMPLETED" } }),
    ]);

    return NextResponse.json(
      {
        teachers: teachers.length,
        // First letters only, for the avatar row.
        teacherInitials: teachers.slice(0, 5).map((t) => t.firstName.trim().charAt(0).toUpperCase()).filter(Boolean),
        students,
        completedClasses,
        reviewCount: reviews._count._all,
        averageRating: reviews._avg.rating == null ? null : Math.round(reviews._avg.rating * 10) / 10,
      },
      { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" } }
    );
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
