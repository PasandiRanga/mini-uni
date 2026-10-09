export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { reviewerName } from "@/lib/reviews";

/** A teacher's most recent reviews, for their public profile. */
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const reviews = await prisma.review.findMany({
            where: { teacherId: params.id, teacher: { teacherProfile: { verificationStatus: "APPROVED" } } },
            select: {
                id: true,
                rating: true,
                comment: true,
                createdAt: true,
                student: { select: { firstName: true, lastName: true } },
                booking: { select: { inquiry: { select: { post: { select: { subject: true } } } } } },
            },
            orderBy: { createdAt: "desc" },
            take: 20,
        });

        return NextResponse.json(
            reviews.map((r) => ({
                id: r.id,
                rating: r.rating,
                comment: r.comment,
                createdAt: r.createdAt,
                author: reviewerName(r.student.firstName, r.student.lastName),
                subject: r.booking.inquiry?.post?.subject ?? null,
            }))
        );
    } catch (error) {
        console.error("Error fetching reviews:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
