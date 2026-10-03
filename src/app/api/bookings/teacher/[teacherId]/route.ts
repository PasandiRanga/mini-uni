import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSelfOrAdmin } from "@/lib/adminAuth";

export async function GET(
    request: Request,
    { params }: { params: { teacherId: string } }
) {
    const auth = await requireSelfOrAdmin(request, params.teacherId);
    if (auth.error) return auth.error;

    try {
        const { teacherId } = params;

        const bookings = await prisma.booking.findMany({
            where: { teacherId },
            include: {
                student: { select: { id: true, firstName: true, lastName: true } },
                timeSlot: { select: { startTime: true, endTime: true } },
                inquiry: { include: { post: { select: { title: true, subject: true } } } },
            },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        return NextResponse.json(bookings);
    } catch (error) {
        console.error("Error fetching teacher bookings:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
