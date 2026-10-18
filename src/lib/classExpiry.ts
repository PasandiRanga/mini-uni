import prisma from "./prisma";
import { createNotification } from "./notifications";
import { buildNoticeEmail, sendEmail } from "./email";

const H = 60 * 60 * 1000;
/** Slightly over a day, so a daily job that runs a little late still covers every class. */
const WINDOW_MS = 26 * H;

type Kind = "ENDING" | "EXPIRED";

/**
 * Reminds teachers before their classes stop being bookable. Run once a day:
 *  - ENDING:  the class's last time is within the next day ("add more times")
 *  - EXPIRED: its last time passed in the last day (it's now hidden from students)
 * Each class gets each reminder once.
 */
export async function remindExpiringClasses(origin: string) {
  const now = Date.now();
  const posts = await prisma.post.findMany({
    where: {
      type: "TEACHER_OFFERING",
      isActive: true,
      user: { isActive: true, teacherProfile: { verificationStatus: "APPROVED" } },
      // Its last time falls inside [now - window, now + window]:
      timeSlots: {
        some: { endTime: { gte: new Date(now - WINDOW_MS) } },
        none: { endTime: { gt: new Date(now + WINDOW_MS) } },
      },
    },
    select: {
      id: true,
      title: true,
      subject: true,
      userId: true,
      user: { select: { email: true, firstName: true, notifyEmail: true } },
      timeSlots: { select: { endTime: true } },
    },
  });

  let sent = 0;
  for (const p of posts) {
    const lastEnd = Math.max(...p.timeSlots.map((s) => s.endTime.getTime()));
    const kind: Kind = lastEnd > now ? "ENDING" : "EXPIRED";

    const already = await prisma.notification.findFirst({
      where: {
        userId: p.userId,
        AND: [
          { metadata: { path: ["postId"], equals: p.id } },
          { metadata: { path: ["expiry"], equals: kind } },
        ],
      },
      select: { id: true },
    });
    if (already) continue;

    const name = p.title || p.subject;
    const msg =
      kind === "ENDING"
        ? {
            title: "Your class is running out of times",
            message: `"${name}" has no times after the next one, so it will disappear from Explore once that's over. Add more times to stay bookable.`,
          }
        : {
            title: "Your class is no longer visible",
            message: `All the times for "${name}" have passed, so students can't find or book it. Use Run again in My Posts to offer it with new times.`,
          };

    await createNotification({
      userId: p.userId,
      type: "CLASS_COMPLETION",
      title: msg.title,
      message: msg.message,
      metadata: { postId: p.id, expiry: kind },
    });
    if (p.user.email && p.user.notifyEmail !== false) {
      const mail = buildNoticeEmail({
        subject: msg.title,
        heading: msg.title,
        body: `Hi ${p.user.firstName},\n\n${msg.message}`,
        link: `${origin}/teacher/dashboard?tab=posts`,
        cta: "Open My Posts",
      });
      await sendEmail({ to: p.user.email, ...mail }).catch((e) => console.error("Failed to send class expiry email:", e));
    }
    sent += 1;
  }
  return { checked: posts.length, sent };
}
