import type { NotificationType } from "@prisma/client";
import prisma from "./prisma";

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

/**
 * Creates an in-app notification for a user, honoring their in-app preference.
 *
 * Never throws: a notification is a side effect of some real action (a booking,
 * a payment, an approval) and must never break that action if it fails. Callers
 * can fire-and-forget. Returns the created row, or null if it was skipped or
 * failed.
 */
export async function createNotification(input: CreateNotificationInput) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { notifyInApp: true },
    });
    if (!user || user.notifyInApp === false) return null;

    return await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        metadata: input.metadata as any,
      },
    });
  } catch (err) {
    console.error("Failed to create notification:", err);
    return null;
  }
}
