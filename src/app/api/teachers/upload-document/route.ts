import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { isProfileComplete, notifyAdminsOfSubmission } from "@/lib/adminAlerts";

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

        // A verified teacher's ID was checked by an admin; swapping it needs a new review.
        if (user.teacherProfile.verificationStatus === "APPROVED") {
            return NextResponse.json(
                { error: "Your ID is verified. Contact support to change it.", code: "IDENTITY_LOCKED" },
                { status: 403 }
            );
        }
        if (typeof documentUrl !== "string" || !documentUrl) {
            return NextResponse.json({ error: "Missing document" }, { status: 400 });
        }

        const validDocTypes = ["ID", "ID_FRONT", "ID_BACK", "UNIVERSITY_ID", "ADDRESS_PROOF", "BANK_DETAILS"];
        if (!validDocTypes.includes(documentType)) {
            return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
        }

        // An upload is often the last step that makes a profile ready for review.
        const wasComplete =
            user.teacherProfile.verificationStatus === "PENDING" ? await isProfileComplete(userId) : null;
        const alertIfNowComplete = async () => {
            if (wasComplete === false && (await isProfileComplete(userId))) {
                await notifyAdminsOfSubmission({ teacherUserId: userId, resubmitted: false, origin: new URL(request.url).origin });
            }
        };

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
                // The rejection reason stays until the teacher resubmits, so it's
                // still shown while they fix the other parts of their profile.
                data: {
                    documentUrl,
                    status: "PENDING",
                },
            });
            await alertIfNowComplete();
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

        await alertIfNowComplete();
        return NextResponse.json(created, { status: 201 });
    } catch (error: any) {
        console.error("Error uploading document:", error);
        return NextResponse.json({ error: error.message || "Failed to upload document" }, { status: 400 });
    }
}
