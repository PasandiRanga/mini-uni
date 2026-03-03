import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        const teacher = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                teacherProfile: {
                    select: {
                        bio: true,
                        subjects: true,
                        experience: true,
                        hourlyRate: true,
                        verificationStatus: true,
                    },
                },
            },
        });

        if (!teacher) {
            return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
        }

        // Flatten for frontend
        const profile = {
            id: teacher.id,
            firstName: teacher.firstName,
            lastName: teacher.lastName,
            bio: teacher.teacherProfile?.bio,
            subjects: teacher.teacherProfile?.subjects,
            startingPrice: teacher.teacherProfile?.hourlyRate,
            verified: teacher.teacherProfile?.verificationStatus === "APPROVED",
        };

        return NextResponse.json(profile);
    } catch (error) {
        console.error("Error fetching teacher profile:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
