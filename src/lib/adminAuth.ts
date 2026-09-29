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
