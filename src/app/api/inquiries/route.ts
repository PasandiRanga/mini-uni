import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function POST(request: Request) {
    const session = await getSessionFromRequest(request);
    if (!session || !session.sub) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { postId, message, timeSlotId } = await request.json();
        const senderId = session.sub;

        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        const inquiry = await prisma.inquiry.create({
            data: {
                postId,
                senderId,
                receiverId: post.userId,
                message,
                status: "PENDING",
                ...(timeSlotId && {
                    timeSlots: {
                        connect: { id: timeSlotId },
                    },
                }),
            },
        });

        return NextResponse.json(inquiry, { status: 201 });
    } catch (error: any) {
        console.error("Error creating inquiry:", error);
        return NextResponse.json({ error: error.message || "Failed to create inquiry" }, { status: 400 });
    }
}
