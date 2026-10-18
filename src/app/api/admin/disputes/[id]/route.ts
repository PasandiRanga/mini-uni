export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { resolveDispute } from "@/lib/disputes";

/**
 * Admin settles one dispute.
 * Body: { action: "refund" | "release", note? }.
 *   - refund  → money back to the student's wallet; the booking is cancelled (note required)
 *   - release → the teacher is paid as normal
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const action = String(body?.action || "").toLowerCase();
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 1000) : "";
  if (action !== "refund" && action !== "release") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  if (action === "refund" && !note) {
    return NextResponse.json({ error: "Add a short note explaining the refund" }, { status: 400 });
  }

  try {
    await resolveDispute(params.id, action, note, new URL(request.url).origin);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error?.message === "ALREADY_RESOLVED") {
      return NextResponse.json({ error: "This report has already been decided" }, { status: 400 });
    }
    if (error?.message === "ESCROW_RELEASED") {
      return NextResponse.json({ error: "The teacher has already been paid for this class, so it can't be refunded here" }, { status: 400 });
    }
    console.error("Error resolving dispute:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
