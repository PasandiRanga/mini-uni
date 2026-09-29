export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

/**
 * A student's inquiries, for their inbox. A student is both a sender (asking
 * about a teacher's class) and a receiver (a teacher replying to their request
 * post), so this returns both directions.
 *
 *   ?box=all       → { sent, received }   (default)
 *   ?box=sent      → sent inquiries (array)
 *   ?box=received  → received inquiries (array)
 */
export async function GET(request: Request, { params }: { params: { studentId: string } }) {
  const session = await getSessionFromRequest(request);
  if (!session || !session.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // It's the student's own inbox — don't let one user read another's.
  if (session.sub !== params.studentId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { studentId } = params;
    const box = new URL(request.url).searchParams.get("box") || "all";

    const postSelect = { select: { id: true, title: true, subject: true, type: true } };

    const sentPromise = prisma.inquiry.findMany({
      where: { senderId: studentId },
      include: {
        receiver: { select: { id: true, firstName: true, lastName: true } },
        post: postSelect,
        timeSlots: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const receivedPromise = prisma.inquiry.findMany({
      where: { receiverId: studentId },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } },
        post: postSelect,
        timeSlots: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    if (box === "sent") return NextResponse.json(await sentPromise);
    if (box === "received") return NextResponse.json(await receivedPromise);

    const [sent, received] = await Promise.all([sentPromise, receivedPromise]);
    return NextResponse.json({ sent, received });
  } catch (error) {
    console.error("Error fetching student inquiries:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
