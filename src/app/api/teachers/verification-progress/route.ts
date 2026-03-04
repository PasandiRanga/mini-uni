export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { VerificationStatus } from "@prisma/client";

export async function GET(request: Request) {
    try {
        const session = await getSessionFromRequest(request);

        if (!session || !session.sub) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.sub;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                teacherProfile: {
                    include: {
                        verificationDocs: true,
                    },
                },
            },
        });

        if (!user || !user.teacherProfile) {
            return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
        }

        const profile = user.teacherProfile;

        const requiredDocs = ["ID", "ADDRESS_PROOF", "BANK_DETAILS"];
        const optionalDocs = ["UNIVERSITY_ID"];

        const uploadedDocs = profile.verificationDocs.map(doc => doc.documentType);
        const requiredUploaded = requiredDocs.filter(doc => uploadedDocs.includes(doc));
        const optionalUploaded = optionalDocs.filter(doc => uploadedDocs.includes(doc));

        let progress = 20;
        progress += (requiredUploaded.length / requiredDocs.length) * 60;

        if (optionalUploaded.length > 0) {
            progress += 10;
        }

        const allApproved = profile.verificationDocs.every(
            doc => doc.status === "APPROVED"
        ) && profile.verificationDocs.length >= requiredDocs.length;

        if (allApproved && profile.verificationStatus === "APPROVED") {
            progress = 100;
        }

        return NextResponse.json({
            progress: Math.min(progress, 100),
            requiredDocuments: requiredDocs.map(doc => ({
                type: doc,
                uploaded: uploadedDocs.includes(doc),
                status: profile.verificationDocs.find(d => d.documentType === doc)?.status || "NOT_UPLOADED",
            })),
            optionalDocuments: optionalDocs.map(doc => ({
                type: doc,
                uploaded: uploadedDocs.includes(doc),
                status: profile.verificationDocs.find(d => d.documentType === doc)?.status || "NOT_UPLOADED",
            })),
            verificationStatus: profile.verificationStatus,
            canStartClasses: profile.verificationStatus === "APPROVED",
        });
    } catch (error) {
        console.error("Error fetching verification progress:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
