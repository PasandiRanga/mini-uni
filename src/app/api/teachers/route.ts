export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ratingSummaries } from "@/lib/reviews";
import { splitGrade } from "@/lib/classLevels";

type Offer = { subjects: Set<string>; levels: Set<string>; startingPrice: number | null; currency: string | null; openClasses: number };

/**
 * What each teacher offers right now, worked out from their open classes
 * (any class with a time still to come): subjects, levels and the cheapest
 * price. Teachers don't fill these in on their profile, so this is what the
 * listing's cards and filters use.
 */
async function openOffers(teacherIds: string[]): Promise<Map<string, Offer>> {
    const posts = await prisma.post.findMany({
        where: {
            userId: { in: teacherIds },
            type: "TEACHER_OFFERING",
            isActive: true,
            timeSlots: { some: { endTime: { gt: new Date() } } },
        },
        select: { userId: true, subject: true, grade: true, fee: true, groupFee: true, currency: true },
    });

    const out = new Map<string, Offer>();
    for (const p of posts) {
        const o = out.get(p.userId) ?? { subjects: new Set(), levels: new Set(), startingPrice: null, currency: null, openClasses: 0 };
        o.openClasses += 1;
        if (p.subject?.trim()) o.subjects.add(p.subject.trim());
        const level = splitGrade(p.grade).level;
        if (level) o.levels.add(level);
        for (const fee of [p.fee, p.groupFee]) {
            const n = fee == null ? NaN : Number(fee);
            if (Number.isFinite(n) && (o.startingPrice == null || n < o.startingPrice)) {
                o.startingPrice = n;
                o.currency = p.currency;
            }
        }
        out.set(p.userId, o);
    }
    return out;
}

export async function GET() {
    try {
        const teachers = await prisma.user.findMany({
            // Only admin-approved teachers are listed publicly.
            where: { role: "TEACHER", isActive: true, teacherProfile: { verificationStatus: "APPROVED" } },
            // Public listing: no email or other contact details.
            select: {
                id: true,
                firstName: true,
                lastName: true,
                teacherProfile: {
                    select: {
                        bio: true,
                        subjects: true,
                        experience: true,
                        verificationStatus: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        const ids = teachers.map((t) => t.id);
        const [ratings, offers] = await Promise.all([ratingSummaries(ids), openOffers(ids)]);

        const list = teachers.map((t) => {
            const o = offers.get(t.id);
            return {
                ...t,
                ...ratings.get(t.id),
                verified: true,
                subjects: [...new Set([...(t.teacherProfile?.subjects ?? []), ...(o?.subjects ?? [])])],
                levels: [...(o?.levels ?? [])],
                startingPrice: o?.startingPrice ?? null,
                currency: o?.currency ?? null,
                openClasses: o?.openClasses ?? 0,
            };
        });
        // Teachers students can actually book come first.
        list.sort((a, b) => Number(b.openClasses > 0) - Number(a.openClasses > 0));

        return NextResponse.json(list);
    } catch (error) {
        console.error("Error fetching teachers:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
