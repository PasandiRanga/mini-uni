import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type");
        const subject = searchParams.get("subject");
        const teacherId = searchParams.get("teacherId");

        const where: any = { isActive: true };
        if (type) where.type = type;
        if (subject) where.subject = subject;
        if (teacherId) where.userId = teacherId;

        const posts = await prisma.post.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, role: true },
                },
                timeSlots: true,
            },
            take: 50,
        });

        return NextResponse.json(posts);
    } catch (error) {
        console.error("Error fetching posts:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    // To be implemented in separate route or shared if preferred.
    // NestJS uses the same path for GET and POST.
    // Next.js also supports this in route.ts
    return await createPost(request);
}

async function createPost(request: Request) {
    const { getSessionFromRequest } = await import("@/lib/auth");
    const session = await getSessionFromRequest(request);

    if (!session || !session.sub) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const data = await request.json();
        const userId = session.sub;
        const role = session.role;

        // Infer post type
        let inferredType: string;
        if (role === "STUDENT") inferredType = "STUDENT_REQUEST";
        else if (role === "TEACHER") inferredType = "TEACHER_OFFERING";
        else inferredType = data.type || "STUDENT_REQUEST";

        // If teacher is creating a offering, ensure verified
        if (role === "TEACHER" && inferredType === "TEACHER_OFFERING") {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: { teacherProfile: { select: { verificationStatus: true } } },
            });
            if (!user?.teacherProfile || user.teacherProfile.verificationStatus !== "APPROVED") {
                return NextResponse.json({ error: "Teacher account not verified to create offerings" }, { status: 403 });
            }
        }

        // Sanitize payload
        const payload: any = {
            userId,
            type: inferredType as any,
            title: data.title,
            description: data.description,
            subject: data.subject,
            isActive: true,
        };

        if (inferredType === "STUDENT_REQUEST") {
            payload.grade = data.grade || null;
            payload.syllabus = data.syllabus || null;
        } else {
            payload.fee = data.fee != null ? Number(data.fee) : null;
            payload.experience = data.experience != null ? Number(data.experience) : null;
            payload.locationLat = data.locationLat || null;
            payload.locationLng = data.locationLng || null;
        }

        const post = await prisma.post.create({ data: payload });

        // Handle timeslots
        if (inferredType === "TEACHER_OFFERING" && data.availabilitySlots && Array.isArray(data.availabilitySlots)) {
            for (const slot of data.availabilitySlots) {
                if (slot.start && slot.end) {
                    await prisma.timeSlot.create({
                        data: {
                            postId: post.id,
                            startTime: new Date(slot.start),
                            endTime: new Date(slot.end)
                        }
                    });
                }
            }
        }

        return NextResponse.json(post, { status: 201 });
    } catch (error: any) {
        console.error("Error creating post:", error);
        return NextResponse.json({ error: error.message || "Failed to create post" }, { status: 400 });
    }
}
