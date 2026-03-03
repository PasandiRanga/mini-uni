/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export const useStudentDashboard = () => {
    const [user, setUser] = useState<any>(null);
    const [upcomingClasses, setUpcomingClasses] = useState<any[]>([]);
    const [recentTeachers, setRecentTeachers] = useState<any[]>([]);
    const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
    const [studyHours, setStudyHours] = useState<number>(0);
    const [completedCount, setCompletedCount] = useState<number>(0);
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

                // fetch teachers for 'Your Teachers' and recommendations
                const tRes = await fetch(`/api/teachers`);
                if (tRes.ok) {
                    const teachers = await tRes.json();
                    setRecentTeachers(teachers.slice(0, 6));
                }

                // fetch bookings (upcoming & history)
                const bRes = await fetch(`/api/bookings/student/${authUser.id}/upcoming`);
                if (bRes.ok) {
                    const bookings = await bRes.json();

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
                    const upcoming = bookings.filter((b: any) => {
                        const s = b.timeSlot?.startTime; return s && new Date(s) > new Date();
                    }).map((b: any) => ({
                        id: b.id,
                        teacher: b.teacher ? `${b.teacher.firstName} ${b.teacher.lastName}` : 'Teacher',
                        subject: b.inquiry?.post?.subject || b.inquiry?.post?.title || '',
                        date: b.timeSlot?.startTime ? new Date(b.timeSlot.startTime).toLocaleDateString() : '',
                        time: b.timeSlot?.startTime ? new Date(b.timeSlot.startTime).toLocaleTimeString() : '',
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

                    // Calendar events
                    const events = bookings.map((b: any) => ({
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
                const unique = Array.from(new Map(recs.map((r: any) => [r.id, r])).values()).slice(0, 6);
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
        recommendations,
        calendarEvents,
        wallet
    };
};
