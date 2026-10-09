import prisma from "./prisma";

export type RatingSummary = { rating: number | null; reviewCount: number };

/** Average stars (one decimal) and review count for each teacher. */
export async function ratingSummaries(teacherIds: string[]): Promise<Map<string, RatingSummary>> {
  const rows = teacherIds.length
    ? await prisma.review.groupBy({
        by: ["teacherId"],
        where: { teacherId: { in: teacherIds } },
        _avg: { rating: true },
        _count: { _all: true },
      })
    : [];
  const out = new Map<string, RatingSummary>();
  for (const id of teacherIds) out.set(id, { rating: null, reviewCount: 0 });
  for (const r of rows) {
    out.set(r.teacherId, {
      rating: r._avg.rating == null ? null : Math.round(r._avg.rating * 10) / 10,
      reviewCount: r._count._all,
    });
  }
  return out;
}

/** "Nimal P." — reviews show who wrote them without a full name. */
export function reviewerName(firstName: string, lastName: string): string {
  const initial = lastName.trim().charAt(0);
  return initial ? `${firstName} ${initial.toUpperCase()}.` : firstName;
}
