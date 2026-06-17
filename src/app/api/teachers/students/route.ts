export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { BookingStatus } from "@prisma/client";

// Booking statuses that represent a real teacher↔student relationship.
const RELATIONSHIP_STATUSES: BookingStatus[] = [
  BookingStatus.CONFIRMED,
  BookingStatus.IN_PROGRESS,
  BookingStatus.COMPLETED,
];

/**
 * GET — unique students the current teacher has confirmed/completed classes with.
 * Aggregates per student: class count, completed count, subjects, last class time.
 */
export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || !session.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "TEACHER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const bookings = await prisma.booking.findMany({
      where: {
        teacherId: session.sub,
        status: { in: RELATIONSHIP_STATUSES },
      },
      select: {
        status: true,
        student: { select: { id: true, firstName: true, lastName: true, email: true } },
        timeSlot: { select: { startTime: true } },
        inquiry: { select: { post: { select: { subject: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Aggregate by student
    const byStudent = new Map<string, {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      classCount: number;
      completedCount: number;
      subjects: Set<string>;
      lastClass: string | null;
    }>();

    for (const b of bookings) {
      if (!b.student) continue;
      const s = b.student;
      const entry = byStudent.get(s.id) ?? {
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email,
        classCount: 0,
        completedCount: 0,
        subjects: new Set<string>(),
        lastClass: null,
      };
      entry.classCount += 1;
      if (b.status === "COMPLETED") entry.completedCount += 1;
      const subject = b.inquiry?.post?.subject;
      if (subject) entry.subjects.add(subject);
      const start = b.timeSlot?.startTime ? new Date(b.timeSlot.startTime).toISOString() : null;
      if (start && (!entry.lastClass || start > entry.lastClass)) entry.lastClass = start;
      byStudent.set(s.id, entry);
    }

    const students = Array.from(byStudent.values()).map((e) => ({
      id: e.id,
      firstName: e.firstName,
      lastName: e.lastName,
      email: e.email,
      classCount: e.classCount,
      completedCount: e.completedCount,
      subjects: Array.from(e.subjects),
      lastClass: e.lastClass,
    }));

    return NextResponse.json(students);
  } catch (error) {
    console.error("Error fetching teacher students:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
