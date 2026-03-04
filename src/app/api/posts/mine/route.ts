export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
    try {
        const session = await getSessionFromRequest(request);

        if (!session || !session.sub) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const posts = await prisma.post.findMany({
            where: { userId: session.sub },
            orderBy: { createdAt: "desc" },
            include: { timeSlots: true },
        });

        return NextResponse.json(posts);
    } catch (error) {
        console.error("Error fetching my posts:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
