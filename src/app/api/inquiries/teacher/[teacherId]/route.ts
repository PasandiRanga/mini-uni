import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: { teacherId: string } }
) {
    try {
        const { teacherId } = params;

        const inquiries = await prisma.inquiry.findMany({
            where: { receiverId: teacherId },
            include: {
                sender: { select: { id: true, firstName: true, lastName: true } },
                post: { select: { id: true, title: true, subject: true } },
                timeSlots: true,
            },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        return NextResponse.json(inquiries);
    } catch (error) {
        console.error("Error fetching teacher inquiries:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
