import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { buildRequestResponseEmail, sendEmail } from "@/lib/email";

const MAX_MESSAGE_LENGTH = 2000;

/**
 * Starts a conversation on a post, addressed to the post's owner.
 *
 * On a student's "looking for a teacher" request this is a teacher's
 * response: only approved teachers may send one, once per request, and the
 * student is notified in-app and by email. On a class post it's a student's
 * question to the teacher.
 */
export async function POST(request: Request) {
    const session = await getSessionFromRequest(request);
    if (!session || !session.sub) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { postId, message: rawMessage, timeSlotId } = await request.json();
        const senderId = session.sub;
        const message = typeof rawMessage === "string" ? rawMessage.trim() : "";

        if (!message) {
            return NextResponse.json({ error: "Write a message first" }, { status: 400 });
        }
        if (message.length > MAX_MESSAGE_LENGTH) {
            return NextResponse.json({ error: `Keep your message under ${MAX_MESSAGE_LENGTH} characters` }, { status: 400 });
        }

        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: { user: { select: { id: true, email: true, firstName: true, notifyEmail: true } } },
        });
        if (!post || !post.isActive) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }
        if (post.userId === senderId) {
            return NextResponse.json({ error: "You can't respond to your own post" }, { status: 400 });
        }

        const sender = await prisma.user.findUnique({
            where: { id: senderId },
            select: { firstName: true, lastName: true, role: true, teacherProfile: { select: { verificationStatus: true } } },
        });
        if (!sender) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const senderName = `${sender.firstName} ${sender.lastName}`.trim();
        const isRequestResponse = post.type === "STUDENT_REQUEST";

        if (isRequestResponse) {
            if (sender.role !== "TEACHER") {
                return NextResponse.json({ error: "Only teachers can respond to a student's request" }, { status: 403 });
            }
            if (sender.teacherProfile?.verificationStatus !== "APPROVED") {
                return NextResponse.json(
                    { error: "Your teacher profile is awaiting admin approval. You can respond once it's approved.", code: "TEACHER_NOT_APPROVED" },
                    { status: 403 }
                );
            }
            // One live response per teacher per request; a declined or cancelled one can be replaced.
            const existing = await prisma.inquiry.findFirst({
                where: { postId, senderId, status: { in: ["PENDING", "RESPONDED", "ACCEPTED"] } },
                select: { id: true },
            });
            if (existing) {
                return NextResponse.json(
                    { error: "You've already responded to this request", code: "ALREADY_RESPONDED", inquiryId: existing.id },
                    { status: 409 }
                );
            }
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

        // Let the post owner know someone reached out.
        await createNotification({
            userId: post.userId,
            type: "INQUIRY_RECEIVED",
            title: isRequestResponse ? `${senderName} responded to your request` : "New inquiry",
            message: isRequestResponse
                ? `${senderName} can help with "${post.title}". Open Inquiries to read their message.`
                : `You have a new inquiry on "${post.title}".`,
            metadata: { inquiryId: inquiry.id, postId },
        });

        // A student may not check the site often, so a response is also emailed (best-effort).
        if (isRequestResponse && post.user.email && post.user.notifyEmail !== false) {
            const origin = new URL(request.url).origin;
            const mail = buildRequestResponseEmail({
                studentFirstName: post.user.firstName,
                teacherName: senderName,
                requestTitle: post.title,
                message,
                link: `${origin}/student/dashboard?tab=inquiries`,
            });
            sendEmail({ to: post.user.email, ...mail }).catch((e) => console.error("Failed to send response email:", e));
        }

        return NextResponse.json(inquiry, { status: 201 });
    } catch (error: any) {
        console.error("Error creating inquiry:", error);
        return NextResponse.json({ error: error.message || "Failed to create inquiry" }, { status: 400 });
    }
}
