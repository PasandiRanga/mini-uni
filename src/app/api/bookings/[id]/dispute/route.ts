export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { MAX_DISPUTE_TEXT, openDispute, respondToDispute } from "@/lib/disputes";
import { DISPUTE_WINDOW_HOURS, isDisputeReason } from "@/lib/disputeReasons";

const OPEN_ERRORS: Record<string, [string, number]> = {
    NOT_FOUND: ["Booking not found", 404],
    ALREADY_REPORTED: ["You've already reported this class", 409],
    NOT_REPORTABLE: ["This class can't be reported", 400],
    WINDOW_CLOSED: [`Classes can be reported from when they start until ${DISPUTE_WINDOW_HOURS} hours after they end`, 400],
    ALREADY_SETTLED: ["This class has already been paid out, so it can't be reported here. Contact support.", 400],
};

/** The student reports a problem with a class. Body: { reason, details }. */
export async function POST(request: Request, { params }: { params: { id: string } }) {
    const session = await getSessionFromRequest(request);
    if (!session || !session.sub) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    if (!isDisputeReason(body?.reason)) {
        return NextResponse.json({ error: "Pick what went wrong" }, { status: 400 });
    }
    const details = typeof body?.details === "string" ? body.details.trim() : "";
    if (details.length < 10) {
        return NextResponse.json({ error: "Tell us a little more about what happened" }, { status: 400 });
    }

    try {
        const dispute = await openDispute({
            bookingId: params.id,
            studentId: session.sub,
            reason: body.reason,
            details: details.slice(0, MAX_DISPUTE_TEXT),
            origin: new URL(request.url).origin,
        });
        return NextResponse.json({ id: dispute.id, status: dispute.status, reason: dispute.reason });
    } catch (error: any) {
        const known = OPEN_ERRORS[error?.message];
        if (known) return NextResponse.json({ error: known[0], code: error.message }, { status: known[1] });
        console.error("Error opening dispute:", error);
        return NextResponse.json({ error: "Couldn't send your report" }, { status: 500 });
    }
}

/** The teacher gives their side while the report is open. Body: { response }. */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    const session = await getSessionFromRequest(request);
    if (!session || !session.sub) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const response = typeof body?.response === "string" ? body.response.trim() : "";
    if (!response) {
        return NextResponse.json({ error: "Write your response first" }, { status: 400 });
    }

    try {
        const dispute = await respondToDispute(params.id, session.sub, response.slice(0, MAX_DISPUTE_TEXT));
        return NextResponse.json({ teacherResponse: dispute.teacherResponse });
    } catch (error: any) {
        if (error?.message === "NOT_FOUND") return NextResponse.json({ error: "Report not found" }, { status: 404 });
        if (error?.message === "ALREADY_RESOLVED") return NextResponse.json({ error: "This report has already been decided" }, { status: 400 });
        console.error("Error responding to dispute:", error);
        return NextResponse.json({ error: "Couldn't save your response" }, { status: 500 });
    }
}
