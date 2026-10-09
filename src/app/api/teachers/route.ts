export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ratingSummaries } from "@/lib/reviews";

export async function GET() {
    try {
        const teachers = await prisma.user.findMany({
            // Only admin-approved teachers are listed publicly.
            where: { role: "TEACHER", isActive: true, teacherProfile: { verificationStatus: "APPROVED" } },
            // Public listing: no email or other contact details.
            select: {
                id: true,
                firstName: true,
                lastName: true,
                teacherProfile: {
                    select: {
                        bio: true,
                        subjects: true,
                        hourlyRate: true,
                        experience: true,
                        verificationStatus: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        const ratings = await ratingSummaries(teachers.map((t) => t.id));
        return NextResponse.json(teachers.map((t) => ({ ...t, ...ratings.get(t.id) })));
    } catch (error) {
        console.error("Error fetching teachers:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
