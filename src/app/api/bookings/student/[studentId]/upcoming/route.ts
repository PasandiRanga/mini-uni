import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSelfOrAdmin } from "@/lib/adminAuth";

export async function GET(
    request: Request,
    { params }: { params: { studentId: string } }
) {
    const auth = await requireSelfOrAdmin(request, params.studentId);
    if (auth.error) return auth.error;

    try {
        const { studentId } = params;
        // ?scope=all returns finished and cancelled classes too, for history
        // views and stats. The default stays limited to active bookings.
        const all = new URL(request.url).searchParams.get("scope") === "all";

        const bookings = await prisma.booking.findMany({
            where: {
                studentId,
                ...(all ? {} : { status: { notIn: ["CANCELLED", "COMPLETED"] } }),
            },
            include: {
                teacher: { select: { id: true, firstName: true, lastName: true } },
                timeSlot: { select: { startTime: true, endTime: true } },
                inquiry: { include: { post: { select: { title: true, subject: true } } } },
            },
            orderBy: { createdAt: "desc" },
            take: all ? 100 : 20,
        });

        return NextResponse.json(bookings);
    } catch (error) {
        console.error("Error fetching student bookings:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
