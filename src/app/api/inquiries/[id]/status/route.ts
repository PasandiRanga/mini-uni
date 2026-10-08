import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

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
        if (!["ACCEPTED", "REJECTED", "CANCELLED"].includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        const inquiry = await prisma.inquiry.findUnique({
            where: { id: inquiryId },
            include: { post: true, receiver: { select: { firstName: true, lastName: true } } }
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

        // Only an open inquiry can change; this also stops double clicks re-notifying.
        if (inquiry.status !== "PENDING") {
            return NextResponse.json({ error: `This was already ${inquiry.status.toLowerCase()}` }, { status: 409 });
        }

        const updated = await prisma.inquiry.update({
            where: { id: inquiryId },
            data: { status },
        });

        const isRequestResponse = inquiry.post.type === "STUDENT_REQUEST";
        const receiverName = `${inquiry.receiver.firstName} ${inquiry.receiver.lastName}`.trim() || "The student";

        // A student answering a teacher's response to their request.
        if (isRequestResponse && (status === "ACCEPTED" || status === "REJECTED")) {
            await createNotification({
                userId: inquiry.senderId,
                type: "INQUIRY_RECEIVED",
                title: status === "ACCEPTED" ? `${receiverName} is interested` : `${receiverName} declined`,
                message:
                    status === "ACCEPTED"
                        ? `${receiverName} wants to learn with you for "${inquiry.post.title}". Make sure you have a class with open times. They'll book it from your profile.`
                        : `${receiverName} went with another option for "${inquiry.post.title}".`,
                metadata: { inquiryId, postId: inquiry.postId, status },
            });
        }

        // Tell the sender when the teacher accepts — that's their cue to book.
        if (!isRequestResponse && status === "ACCEPTED") {
            await createNotification({
                userId: inquiry.senderId,
                type: "SLOT_CONFIRMED",
                title: "Inquiry accepted",
                message: `Your inquiry on "${inquiry.post.title}" was accepted. You can now book the class.`,
                metadata: { inquiryId, postId: inquiry.postId },
            });
        }

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error("Error updating inquiry status:", error);
        return NextResponse.json({ error: error.message || "Failed to update inquiry" }, { status: 400 });
    }
}
