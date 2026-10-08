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
        // ?box=sent: the teacher's own responses to students' requests.
        const box = new URL(request.url).searchParams.get("box");

        if (box === "sent") {
            const sent = await prisma.inquiry.findMany({
                where: { senderId: teacherId },
                include: {
                    receiver: { select: { id: true, firstName: true, lastName: true } },
                    post: { select: { id: true, title: true, subject: true, type: true } },
                },
                orderBy: { createdAt: "desc" },
                take: 50,
            });
            return NextResponse.json(sent);
        }

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
