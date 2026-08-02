export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { applyPayHereResult, verifyNotification, type PayHereNotification } from "@/lib/payhere";

/**
 * PayHere's server-to-server payment notification — the only thing that makes a
 * payment real. PayHere posts here as form data, expects a plain 200, and may
 * retry, so everything downstream is idempotent.
 *
 * The notify_url must be publicly reachable: in local development, tunnel it
 * (e.g. ngrok) or use the sandbox confirm route instead.
 */
export async function POST(request: Request) {
    try {
        const form = await request.formData();
        const value = (key: string) => (form.get(key) ?? "").toString();

        const notification: PayHereNotification = {
            merchant_id: value("merchant_id"),
            order_id: value("order_id"),
            payment_id: value("payment_id"),
            payhere_amount: value("payhere_amount"),
            payhere_currency: value("payhere_currency"),
            status_code: value("status_code"),
            md5sig: value("md5sig"),
            method: value("method"),
            status_message: value("status_message"),
        };

        // Anyone can POST here, so an unsigned or mis-signed call is dropped.
        if (!verifyNotification(notification)) {
            console.warn("Rejected PayHere notification with a bad signature", notification.order_id);
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }

        const result = await applyPayHereResult({
            orderId: notification.order_id,
            statusCode: notification.status_code,
            paymentId: notification.payment_id,
            method: notification.method,
        });

        if (!result.handled) {
            console.warn("PayHere notification for an unknown order", notification.order_id);
        }

        // PayHere only cares that it got a 200.
        return new NextResponse("OK", { status: 200 });
    } catch (error: any) {
        console.error("Error handling PayHere notification:", error);
        return NextResponse.json({ error: "Failed to process notification" }, { status: 500 });
    }
}
