export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getSessionFromRequest } from "@/lib/auth";

const ALLOWED = [
    "image/jpeg", "image/png", "image/webp", "image/gif",
    "application/pdf",
    "video/mp4", "video/webm", "video/quicktime",
];
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB — covers a short screen recording

/**
 * Authorises a direct browser upload of dispute evidence to Vercel Blob. The
 * file goes straight to Blob (not through this function), so large recordings
 * aren't capped by the serverless request-body limit.
 */
export async function POST(request: Request) {
    const session = await getSessionFromRequest(request);
    if (!session?.sub) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = (await request.json()) as HandleUploadBody;
        const result = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async () => ({
                allowedContentTypes: ALLOWED,
                maximumSizeInBytes: MAX_BYTES,
                addRandomSuffix: true,
                // Short-lived, single-use token tied to this signed-in user.
                tokenPayload: JSON.stringify({ userId: session.sub }),
            }),
            onUploadCompleted: async () => {
                /* nothing to do: the dispute stores the URL when it's submitted */
            },
        });
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error?.message || "Upload failed" }, { status: 400 });
    }
}
