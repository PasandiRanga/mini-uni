import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ratingSummaries } from "@/lib/reviews";

type Background = {
    experience: number | null;
    employmentStatus: string | null;
    universityName: string | null;
    stream: string | null;
    workingStatus: string | null;
    profession: string | null;
    employer: string | null;
};

/**
 * One-line facts for the public profile, e.g. "Undergraduate at University of
 * Moratuwa". A school-age teacher's school isn't shown, only their stream.
 */
function backgroundLines(p: Background): string[] {
    const lines: string[] = [];
    if (p.employmentStatus === "STUDENT") {
        lines.push(p.stream ? `A/L student, ${p.stream}` : "A/L student");
    } else if (p.employmentStatus === "UNDERGRADUATE" && p.universityName) {
        lines.push(`Undergraduate at ${p.universityName}`);
    } else if (p.employmentStatus === "GRADUATE" && p.profession) {
        const working = p.workingStatus !== "Not currently working" && p.employer;
        lines.push(working ? `${p.profession} at ${p.employer}` : p.profession);
    }
    if (p.experience) lines.push(`${p.experience} year${p.experience === 1 ? "" : "s"} of teaching experience`);
    return lines;
}

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
                        employmentStatus: true,
                        universityName: true,
                        stream: true,
                        workingStatus: true,
                        profession: true,
                        employer: true,
                    },
                },
            },
        });

        // Public profiles exist only for approved teachers.
        if (!teacher || teacher.teacherProfile?.verificationStatus !== "APPROVED") {
            return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
        }

        const ratings = await ratingSummaries([teacher.id]);

        // Flatten for frontend
        const profile = {
            ...ratings.get(teacher.id),
            id: teacher.id,
            firstName: teacher.firstName,
            lastName: teacher.lastName,
            bio: teacher.teacherProfile?.bio,
            subjects: teacher.teacherProfile?.subjects,
            startingPrice: teacher.teacherProfile?.hourlyRate,
            verified: teacher.teacherProfile?.verificationStatus === "APPROVED",
            background: teacher.teacherProfile ? backgroundLines(teacher.teacherProfile) : [],
        };

        return NextResponse.json(profile);
    } catch (error) {
        console.error("Error fetching teacher profile:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
