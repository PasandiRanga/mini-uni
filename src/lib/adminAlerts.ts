import prisma from "./prisma";
import { createNotification } from "./notifications";
import { buildTeacherSubmittedEmail, sendEmail } from "./email";
import { computeProfileCompletion } from "./teacherVerification";

/** Don't alert admins about the same teacher more than once in this window. */
const REPEAT_WINDOW_MS = 12 * 60 * 60 * 1000;

/** Whether a teacher's profile is complete right now (null if there's no profile). */
export async function isProfileComplete(userId: string): Promise<boolean | null> {
  const profile = await prisma.teacherProfile.findUnique({
    where: { userId },
    include: { verificationDocs: true },
  });
  return profile ? computeProfileCompletion(profile).complete : null;
}

/**
 * Tells every admin that a teacher is ready for review, in-app and by email.
 * Best-effort: it never throws, so the teacher's save always succeeds.
 */
export async function notifyAdminsOfSubmission(opts: { teacherUserId: string; resubmitted: boolean; origin: string }) {
  try {
    const teacher = await prisma.user.findUnique({
      where: { id: opts.teacherUserId },
      select: { firstName: true, lastName: true, teacherProfile: { select: { fullName: true } } },
    });
    if (!teacher) return;
    const teacherName = teacher.teacherProfile?.fullName || `${teacher.firstName} ${teacher.lastName}`.trim();

    // A teacher who edits a field back and forth would otherwise alert on every save.
    const recent = await prisma.notification.findFirst({
      where: {
        type: "VERIFICATION_STATUS",
        createdAt: { gte: new Date(Date.now() - REPEAT_WINDOW_MS) },
        metadata: { path: ["teacherUserId"], equals: opts.teacherUserId },
      },
      select: { id: true },
    });
    if (recent && !opts.resubmitted) return;

    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", isActive: true },
      select: { id: true, email: true, notifyEmail: true },
    });
    const mail = buildTeacherSubmittedEmail({ teacherName, resubmitted: opts.resubmitted, link: `${opts.origin}/admin` });

    await Promise.all(
      admins.map(async (admin) => {
        await createNotification({
          userId: admin.id,
          type: "VERIFICATION_STATUS",
          title: `${teacherName} is ready for review`,
          message: opts.resubmitted
            ? "They updated their profile after a rejection and resubmitted it."
            : "Their profile is complete and waiting for approval.",
          metadata: { teacherUserId: opts.teacherUserId, resubmitted: opts.resubmitted },
        });
        if (admin.email && admin.notifyEmail !== false) {
          await sendEmail({ to: admin.email, ...mail }).catch((e) => console.error("Failed to email admin:", e));
        }
      })
    );
  } catch (err) {
    console.error("Failed to notify admins of a teacher submission:", err);
  }
}
