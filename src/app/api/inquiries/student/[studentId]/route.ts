import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: { studentId: string } }
) {
    try {
        const { studentId } = params;

        const inquiries = await prisma.inquiry.findMany({
            where: { senderId: studentId },
            include: {
                receiver: { select: { id: true, firstName: true, lastName: true } },
                post: { select: { id: true, title: true, subject: true } },
                timeSlots: true,
            },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        return NextResponse.json(inquiries);
    } catch (error) {
        console.error("Error fetching student inquiries:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
