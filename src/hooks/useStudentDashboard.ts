/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

export const useStudentDashboard = () => {
    const [user, setUser] = useState<any>(null);
    const [upcomingClasses, setUpcomingClasses] = useState<any[]>([]);
    const [recentTeachers, setRecentTeachers] = useState<any[]>([]);
    const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
    const [studyHours, setStudyHours] = useState<number>(0);
    const [completedCount, setCompletedCount] = useState<number>(0);
    const [subjectCount, setSubjectCount] = useState<number>(0);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
    const [wallet, setWallet] = useState<any>(null);
    const { user: authUser } = useAuth();

    useEffect(() => {
        try {
            const u = localStorage.getItem("user");
            if (u) setUser(JSON.parse(u));
        } catch (e) {
            setUser(null);
        }
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            if (!authUser?.id) return;
            try {
                // fetch user profile (to read interests)
                const meRes = await fetch(`/api/users/me`);
                const me = meRes.ok ? await meRes.json() : null;

                // fetch bookings (upcoming & history)
                const bRes = await fetch(`/api/bookings/student/${authUser.id}/upcoming?scope=all`);
                if (bRes.ok) {
                    const bookings = await bRes.json();
                    const live = bookings.filter((b: any) => b.status !== 'CANCELLED');

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

                    // Enrolled Courses: confirmed / in-progress
                    const enrolled = bookings.filter((b: any) => ['CONFIRMED', 'IN_PROGRESS', 'PAYMENT_COMPLETED'].includes(b.status));
                    setEnrolledCourses(enrolled.map((b: any) => ({
                        id: b.id,
                        teacher: b.teacher ? `${b.teacher.firstName} ${b.teacher.lastName}` : 'Teacher',
                        subject: b.inquiry?.post?.subject || b.inquiry?.post?.title || '',
                        status: b.status,
                        googleMeetLink: b.googleMeetLink || null,
                        timeSlot: b.timeSlot,
                    })));

                    // Upcoming Classes: future timeSlots
                    const upcoming = live.filter((b: any) => {
                        const s = b.timeSlot?.startTime; return s && new Date(s) > new Date();
                    }).map((b: any) => ({
                        id: b.id,
                        teacher: b.teacher ? `${b.teacher.firstName} ${b.teacher.lastName}` : 'Teacher',
                        subject: b.inquiry?.post?.subject || b.inquiry?.post?.title || '',
                        date: b.timeSlot?.startTime ? format(new Date(b.timeSlot.startTime), 'EEE, MMM d') : '',
                        time: b.timeSlot?.startTime ? format(new Date(b.timeSlot.startTime), 'h:mm a') : '',
                        googleMeetLink: b.googleMeetLink || null,
                        status: b.status,
                    }));
                    setUpcomingClasses(upcoming);

                    // Study hours: from completed bookings
                    const completed = bookings.filter((b: any) => b.status === 'COMPLETED' || b.completedAt);
                    let hours = 0;
                    for (const b of completed) {
                        if (b.timeSlot?.startTime && b.timeSlot?.endTime) {
                            const durMs = new Date(b.timeSlot.endTime).getTime() - new Date(b.timeSlot.startTime).getTime();
                            hours += durMs / (1000 * 60 * 60);
                        }
                    }
                    setStudyHours(Math.round(hours * 10) / 10);
                    setCompletedCount(completed.length);

                    // Subjects studied: distinct subjects across paid, uncancelled classes.
                    const subjects = new Set(
                        bookings
                            .filter((b: any) => !['CANCELLED', 'PENDING_PAYMENT'].includes(b.status))
                            .map((b: any) => (b.inquiry?.post?.subject || '').trim().toLowerCase())
                            .filter(Boolean)
                    );
                    setSubjectCount(subjects.size);

                    // Calendar events
                    const events = live.map((b: any) => ({
                        id: b.id,
                        title: b.inquiry?.post?.title || (b.teacher ? `${b.teacher.firstName} ${b.teacher.lastName}` : 'Class'),
                        start: b.timeSlot?.startTime,
                        end: b.timeSlot?.endTime,
                        status: b.status,
                    }));
                    setCalendarEvents(events.filter((e: any) => e.start));
                }

                // Recommendations based on interests
                let recs: any[] = [];
                const interests: string[] = me?.studentProfile?.interests || [];
                if (interests.length > 0) {
                    for (const subject of interests.slice(0, 3)) {
                        try {
                            const pRes = await fetch(`/api/posts?subject=${encodeURIComponent(subject)}`);
                            if (pRes.ok) {
                                const posts = await pRes.json();
                                recs = recs.concat(posts);
                            }
                        } catch (e) {
                            // ignore per-subject failures
                        }
                    }
                }
                if (recs.length === 0) {
                    const pRes = await fetch(`/api/posts`);
                    if (pRes.ok) recs = await pRes.json();
                }
                // Only classes a student can take — not other students' requests, and never their own posts.
                const offerings = recs.filter((r: any) => r.type === 'TEACHER_OFFERING' && r.userId !== authUser.id);
                const unique = Array.from(new Map(offerings.map((r: any) => [r.id, r])).values()).slice(0, 6);
                setRecommendations(unique);

                // wallet for student
                const wRes = await fetch(`/api/wallets/me`);
                if (wRes.ok) setWallet(await wRes.json());

            } catch (err) {
                console.error('Error fetching dashboard data', err);
            }
        };

        fetchData();
    }, [authUser]);

    return {
        user,
        upcomingClasses,
        recentTeachers,
        enrolledCourses,
        studyHours,
        completedCount,
        subjectCount,
        recommendations,
        calendarEvents,
        wallet
    };
};
