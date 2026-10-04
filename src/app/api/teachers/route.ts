export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

        return NextResponse.json(teachers);
    } catch (error) {
        console.error("Error fetching teachers:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
