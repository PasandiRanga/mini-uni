import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function POST(request: Request) {
    const session = await getSessionFromRequest(request);
    if (!session || !session.sub) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { documentType, documentUrl } = await request.json();
        const userId = session.sub;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { teacherProfile: true },
        });

        if (!user || !user.teacherProfile) {
            return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
        }

        const validDocTypes = ["ID", "UNIVERSITY_ID", "ADDRESS_PROOF", "BANK_DETAILS"];
        if (!validDocTypes.includes(documentType)) {
            return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
        }

        // Check if document of this type already exists
        const existingDoc = await prisma.verificationDocument.findFirst({
            where: {
                teacherId: user.teacherProfile.id,
                documentType,
            },
        });

        if (existingDoc) {
            const updated = await prisma.verificationDocument.update({
                where: { id: existingDoc.id },
                data: {
                    documentUrl,
                    status: "PENDING",
                    rejectionReason: null,
                },
            });
            return NextResponse.json(updated);
        }

        const created = await prisma.verificationDocument.create({
            data: {
                teacherId: user.teacherProfile.id,
                documentType,
                documentUrl,
                status: "PENDING",
            },
        });

        return NextResponse.json(created, { status: 201 });
    } catch (error: any) {
        console.error("Error uploading document:", error);
        return NextResponse.json({ error: error.message || "Failed to upload document" }, { status: 400 });
    }
}
