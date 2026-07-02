import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const post = await prisma.post.findUnique({
            where: { id: params.id },
            include: { timeSlots: true, user: true },
        });

        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        return NextResponse.json(post);
    } catch (error) {
        console.error("Error fetching post:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await getSessionFromRequest(request);
    if (!session || !session.sub) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const postId = params.id;
        const userId = session.sub;
        const role = session.role;

        const existing = await prisma.post.findUnique({ where: { id: postId } });
        if (!existing) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }
        if (existing.userId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (role === "TEACHER") {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: { teacherProfile: { select: { verificationStatus: true } } },
            });
            if (!user?.teacherProfile || user.teacherProfile.verificationStatus !== "APPROVED") {
                return NextResponse.json({ error: "Teacher account not verified to modify offerings" }, { status: 403 });
            }
        }

        const data = await request.json();

        // Only persist real Post columns — the client also sends helper fields
        // (availabilitySlots, durationMin, …) that are not scalar columns.
        const updateData: any = {
            title: data.title,
            description: data.description,
            subject: data.subject,
        };

        if (existing.type === "STUDENT_REQUEST") {
            updateData.grade = data.grade ?? null;
            updateData.syllabus = data.syllabus ?? null;
        } else {
            updateData.fee = data.fee != null ? Number(data.fee) : null;
            updateData.ratePerHour = data.ratePerHour != null ? Number(data.ratePerHour) : null;
            updateData.thumbnailUrl = data.thumbnailUrl ?? null;
            updateData.maxStudents = data.maxStudents != null ? Number(data.maxStudents) : null;
            if (Array.isArray(data.classTypes)) {
                const valid = ["INDIVIDUAL", "GROUP", "MASS"];
                updateData.classTypes = data.classTypes.filter((t: string) => valid.includes(t));
            }
        }

        const updated = await prisma.post.update({
            where: { id: postId },
            data: updateData,
        });

        // Replace availability for teacher offerings. Only unbooked (AVAILABLE) slots are
        // swapped out so existing bookings are preserved.
        if (existing.type === "TEACHER_OFFERING" && Array.isArray(data.availabilitySlots)) {
            await prisma.timeSlot.deleteMany({ where: { postId, status: "AVAILABLE" } });
            for (const slot of data.availabilitySlots) {
                if (slot.start && slot.end) {
                    await prisma.timeSlot.create({
                        data: { postId, startTime: new Date(slot.start), endTime: new Date(slot.end) },
                    });
                }
            }
        }

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error("Error updating post:", error);
        return NextResponse.json({ error: error.message || "Failed to update post" }, { status: 400 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await getSessionFromRequest(request);
    if (!session || !session.sub) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const postId = params.id;
        const userId = session.sub;

        const existing = await prisma.post.findUnique({ where: { id: postId } });
        if (!existing || existing.userId !== userId) {
            return NextResponse.json({ error: "Not found or forbidden" }, { status: 403 });
        }

        await prisma.post.update({
            where: { id: postId },
            data: { isActive: false },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting post:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
