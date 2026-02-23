import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: { studentId: string } }
) {
    try {
        const { studentId } = params;

        const bookings = await prisma.booking.findMany({
            where: {
                studentId,
                status: { notIn: ["CANCELLED", "COMPLETED"] },
            },
            include: {
                teacher: { select: { id: true, firstName: true, lastName: true } },
                timeSlot: { select: { startTime: true, endTime: true } },
                inquiry: { include: { post: { select: { title: true, subject: true } } } },
            },
            orderBy: { createdAt: "desc" },
            take: 20,
        });

        return NextResponse.json(bookings);
    } catch (error) {
        console.error("Error fetching student bookings:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
