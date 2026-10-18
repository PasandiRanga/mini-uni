/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { isPostExpired } from "@/components/post/postCardBits";
import { splitGrade } from "@/lib/classLevels";

const norm = (s?: string | null) => (s || "").trim().toLowerCase();

/**
 * "For you": open classes ranked by what the student has shown interest in:
 * the subjects and levels of classes they booked, their own "looking for a
 * teacher" requests, and classes they liked. With no signals yet, the newest
 * open classes.
 */
function recommend(posts: any[], bookings: any[], myPosts: any[], studentId: string) {
    const subjects = new Set<string>();
    const levels = new Set<string>();
    const add = (subject?: string | null, grade?: string | null) => {
        if (norm(subject)) subjects.add(norm(subject));
        const level = norm(splitGrade(grade).level);
        if (level) levels.add(level);
    };
    bookings.forEach((b) => add(b.inquiry?.post?.subject));
    myPosts.filter((p) => p.type === "STUDENT_REQUEST").forEach((p) => add(p.subject, p.grade));
    posts.filter((p) => p.likedByMe).forEach((p) => add(p.subject, p.grade));

    return posts
        .filter((p) => p.type === "TEACHER_OFFERING" && p.userId !== studentId && !isPostExpired(p.timeSlots))
        .map((p) => ({
            post: p,
            score:
                (subjects.has(norm(p.subject)) ? 3 : 0) +
                (levels.has(norm(splitGrade(p.grade).level)) ? 2 : 0) +
                (p.likedByMe ? 1 : 0),
        }))
        .sort((a, b) => b.score - a.score || new Date(b.post.createdAt).getTime() - new Date(a.post.createdAt).getTime())
        .slice(0, 6)
        .map((r) => r.post);
}

export const useStudentDashboard = () => {
    const [user, setUser] = useState<any>(null);
    const [upcomingClasses, setUpcomingClasses] = useState<any[]>([]);
    const [recentTeachers, setRecentTeachers] = useState<any[]>([]);
    const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
    const [completedCount, setCompletedCount] = useState<number>(0);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
    const [wallet, setWallet] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { user: authUser } = useAuth();
    const studentId = authUser?.id;

    useEffect(() => {
        try {
            const u = localStorage.getItem("user");
            if (u) setUser(JSON.parse(u));
        } catch (e) {
            setUser(null);
        }
    }, []);

    // Keyed on the id, not the user object: refreshing the auth state (e.g. a
    // currency change) mustn't reload the whole dashboard.
    useEffect(() => {
        if (!studentId) return;
        let cancelled = false;
        const getJson = (url: string) => fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null);

        (async () => {
            // One round of parallel requests, then a single update, so the tiles
            // don't flicker through partial numbers.
            const [bookingsRes, posts, myPosts, walletRes] = await Promise.all([
                getJson(`/api/bookings/student/${studentId}/upcoming?scope=all`),
                getJson(`/api/posts`),
                getJson(`/api/posts/mine`),
                getJson(`/api/wallets/me`),
            ]);
            if (cancelled) return;

            const bookings: any[] = Array.isArray(bookingsRes) ? bookingsRes : [];
            const live = bookings.filter((b) => b.status !== "CANCELLED");

            // Your teachers: the people this student has actually booked, most recent first.
            const teachers = new Map<string, any>();
            for (const b of live) {
                if (!b.teacher?.id || teachers.has(b.teacher.id)) continue;
                teachers.set(b.teacher.id, {
                    ...b.teacher,
                    teacherProfile: { subjects: [b.inquiry?.post?.subject].filter(Boolean) },
                });
            }
            setRecentTeachers(Array.from(teachers.values()).slice(0, 6));

            // Enrolled: paid classes that haven't finished.
            setEnrolledCourses(
                bookings
                    .filter((b) => ["CONFIRMED", "IN_PROGRESS", "PAYMENT_COMPLETED"].includes(b.status))
                    .map((b) => ({
                        id: b.id,
                        teacher: b.teacher ? `${b.teacher.firstName} ${b.teacher.lastName}` : "Teacher",
                        subject: b.inquiry?.post?.subject || b.inquiry?.post?.title || "",
                        status: b.status,
                        googleMeetLink: b.googleMeetLink || null,
                        timeSlot: b.timeSlot,
                    }))
            );

            // Upcoming: classes still to start.
            setUpcomingClasses(
                live
                    .filter((b) => b.timeSlot?.startTime && new Date(b.timeSlot.startTime) > new Date())
                    .map((b) => ({
                        id: b.id,
                        teacher: b.teacher ? `${b.teacher.firstName} ${b.teacher.lastName}` : "Teacher",
                        subject: b.inquiry?.post?.subject || b.inquiry?.post?.title || "",
                        date: format(new Date(b.timeSlot.startTime), "EEE, MMM d"),
                        time: format(new Date(b.timeSlot.startTime), "h:mm a"),
                        googleMeetLink: b.googleMeetLink || null,
                        status: b.status,
                    }))
            );

            setCompletedCount(bookings.filter((b) => b.status === "COMPLETED").length);

            setCalendarEvents(
                live
                    .map((b) => ({
                        id: b.id,
                        title: b.inquiry?.post?.title || (b.teacher ? `${b.teacher.firstName} ${b.teacher.lastName}` : "Class"),
                        start: b.timeSlot?.startTime,
                        end: b.timeSlot?.endTime,
                        status: b.status,
                    }))
                    .filter((e) => e.start)
            );

            setRecommendations(recommend(Array.isArray(posts) ? posts : [], live, Array.isArray(myPosts) ? myPosts : [], studentId));
            setWallet(walletRes);
            setLoading(false);
        })();

        return () => {
            cancelled = true;
        };
    }, [studentId]);

    return {
        user,
        loading,
        upcomingClasses,
        recentTeachers,
        enrolledCourses,
        completedCount,
        recommendations,
        calendarEvents,
        wallet,
    };
};
