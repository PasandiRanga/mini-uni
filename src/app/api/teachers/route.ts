export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const teachers = await prisma.user.findMany({
            where: { role: "TEACHER", isActive: true },
            select: {
                id: true,
                email: true,
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
