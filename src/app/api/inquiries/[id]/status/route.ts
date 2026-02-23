import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await getSessionFromRequest(request);
    if (!session || !session.sub) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const inquiryId = params.id;
        const userId = session.sub;
        const { status } = await request.json();

        const inquiry = await prisma.inquiry.findUnique({
            where: { id: inquiryId },
            include: { post: true }
        });

        if (!inquiry) {
            return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
        }

        // Only receiver can respond/accept/reject
        if (inquiry.receiverId !== userId && status !== "CANCELLED") {
            return NextResponse.json({ error: "Only the receiver can update this inquiry status" }, { status: 403 });
        }

        // Only sender can cancel
        if (status === "CANCELLED" && inquiry.senderId !== userId) {
            return NextResponse.json({ error: "Only the sender can cancel this inquiry" }, { status: 403 });
        }

        const updated = await prisma.inquiry.update({
            where: { id: inquiryId },
            data: { status },
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error("Error updating inquiry status:", error);
        return NextResponse.json({ error: error.message || "Failed to update inquiry" }, { status: 400 });
    }
}
