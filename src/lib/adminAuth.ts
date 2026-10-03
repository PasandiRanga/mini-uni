import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * Verifies a request comes from a signed-in ADMIN. Returns the session on
 * success, or null otherwise. The role is re-checked against the database
 * rather than trusted from the JWT, so demoting a user takes effect at once
 * without waiting for their token to expire.
 */
export async function getAdminSession(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session || !session.sub) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { role: true, isActive: true },
  });

  if (!user || !user.isActive || user.role !== "ADMIN") return null;
  return session;
}

/**
 * Guards a route that returns one user's private data (`/api/.../[userId]`).
 * Lets through that user themselves or an admin. Returns the session, or a
 * 401/403 response to send back as-is.
 */
export async function requireSelfOrAdmin(request: Request, userId: string) {
  const session = await getSessionFromRequest(request);
  if (!session || !session.sub) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.sub === userId) return { session };
  if (await getAdminSession(request)) return { session };
  return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
}
