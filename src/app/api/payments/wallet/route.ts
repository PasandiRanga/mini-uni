export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { payBookingFromWallet } from "@/lib/wallet";

/** Pays for a booking out of the student's wallet balance instead of by card. */
export async function POST(request: Request) {
    const session = await getSessionFromRequest(request);
    if (!session || !session.sub) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { bookingId } = await request.json();
        if (!bookingId) {
            return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
        }

        const result = await payBookingFromWallet(session.sub, bookingId);
        return NextResponse.json({ success: true, ...result });
    } catch (error: any) {
        const known: Record<string, { error: string; status: number }> = {
            BOOKING_NOT_FOUND: { error: "Booking not found", status: 404 },
            FORBIDDEN: { error: "This booking isn't yours", status: 403 },
            BOOKING_CANCELLED: { error: "This class has been cancelled", status: 400 },
            ALREADY_PAID: { error: "This class has already been paid for", status: 400 },
            INSUFFICIENT_FUNDS: { error: "Your wallet balance doesn't cover this class", status: 400 },
        };

        const mapped = known[error?.message];
        if (mapped) return NextResponse.json({ error: mapped.error }, { status: mapped.status });

        console.error("Error paying from wallet:", error);
        return NextResponse.json({ error: error.message || "Payment failed" }, { status: 400 });
    }
}
