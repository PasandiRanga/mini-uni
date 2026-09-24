export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { markWithdrawalProcessing, markWithdrawalPaid, rejectWithdrawal } from "@/lib/wallet";

/**
 * Admin action on one withdrawal request.
 * Body: { action: "process" | "paid" | "reject", reference?, note? }.
 *   - process → PROCESSING (payout started)
 *   - paid    → PAID (money sent; optional bank reference)
 *   - reject  → REJECTED and money returned to the teacher's balance (reason required)
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || "").toLowerCase();

    let withdrawal;
    if (action === "process") {
      withdrawal = await markWithdrawalProcessing(params.id);
    } else if (action === "paid") {
      const reference = typeof body?.reference === "string" ? body.reference.trim() : undefined;
      withdrawal = await markWithdrawalPaid(params.id, reference);
    } else if (action === "reject") {
      const note = typeof body?.note === "string" ? body.note.trim() : "";
      if (!note) {
        return NextResponse.json({ error: "A reason is required to reject" }, { status: 400 });
      }
      withdrawal = await rejectWithdrawal(params.id, note);
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    return NextResponse.json(withdrawal);
  } catch (error: any) {
    if (error?.message === "NOT_ACTIONABLE") {
      return NextResponse.json(
        { error: "This withdrawal has already been settled and can no longer be changed" },
        { status: 400 }
      );
    }
    console.error("Error processing withdrawal:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
