export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { resolveDispute } from "@/lib/disputes";

/**
 * Admin settles one dispute.
 * Body: { action, note? }.
 *   - refund          → full refund to the student's wallet; booking cancelled, no fault (note required)
 *   - release         → the teacher is paid as normal
 *   - student_no_show → student refunded less a 10% absence fee; teacher not paid
 *   - teacher_no_show → student fully refunded; teacher charged a 10% penalty
 */
const ACTIONS = ["refund", "release", "student_no_show", "teacher_no_show"] as const;
type Action = (typeof ACTIONS)[number];
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const action = String(body?.action || "").toLowerCase() as Action;
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 1000) : "";
  if (!ACTIONS.includes(action)) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  if (action !== "release" && !note) {
    return NextResponse.json({ error: "Add a short note explaining the decision" }, { status: 400 });
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
