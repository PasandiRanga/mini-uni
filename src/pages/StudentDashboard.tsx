/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  GraduationCap,
  Home,
  Search,
  Calendar,
  Wallet,
  Settings,
  Bell,
  LogOut,
  Plus,
  Clock,
  Video,
  Star,
  BookOpen,
  ChevronRight,
  TrendingUp
} from "lucide-react";
import MyClasses from '@/components/classes/MyClasses';
import ExploreContent from "@/components/explore/ExploreContent";
import DashboardLayout, { useDashboard } from '@/components/layout/DashboardLayout';

// dynamic data will be fetched from the backend

const StudentDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [upcomingClasses, setUpcomingClasses] = useState<any[]>([]);
  const [recentTeachers, setRecentTeachers] = useState<any[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [studyHours, setStudyHours] = useState<number>(0);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const { user: authUser, logout: authLogout, token } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Child component that consumes Dashboard context — rendered inside DashboardLayout
  const DashboardContent: React.FC = () => {
    const { activeTab } = useDashboard();
    return (
      <>
        {activeTab === 'explore' ? (
          <ExploreContent />
        ) : activeTab === 'classes' ? (
          // My Classes view for students
          <div className="space-y-6">
            <MyClasses />
          </div>
        ) : (
        /* Stats Grid */
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-card rounded-2xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <Badge variant="secondary" className="bg-success/10 text-success">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12%
              </Badge>
            </div>
            <p className="text-2xl sm:text-3xl font-bold">{completedCount}</p>
            <p className="text-sm text-muted-foreground">Classes Completed</p>
          </div>

          <div className="bg-card rounded-2xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-accent" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold">36 hrs</p>
            <p className="text-sm text-muted-foreground">Total Learning Time</p>
          </div>

          <div className="bg-card rounded-2xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-secondary" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold">5</p>
            <p className="text-sm text-muted-foreground">Subjects Studied</p>
          </div>

          <div className="bg-card rounded-2xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-warning" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold">$245</p>
            <p className="text-sm text-muted-foreground">Wallet Balance</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Enrolled Courses & Study Hours */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-2xl shadow-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">Enrolled Courses</h2>
                <Button variant="ghost" size="sm" className="text-primary">Manage</Button>
              </div>
              <div className="divide-y divide-border">
                {enrolledCourses.length === 0 && (
                  <p className="p-4 text-sm text-muted-foreground">You have no confirmed classes yet.</p>
                )}
                {enrolledCourses.map((c) => (
                  <div key={c.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between">
                    <div>
                      <p className="font-medium">{c.subject}</p>
                      <p className="text-sm text-muted-foreground">with {c.teacher}</p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-primary/10 text-primary">{c.status}</Badge>
                      {c.googleMeetLink && (
                        <div className="mt-2">
                          <a href={c.googleMeetLink} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">Join Meet</a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card rounded-2xl p-5 shadow-card">
                <p className="text-sm text-muted-foreground">Study Hours</p>
                <p className="text-2xl sm:text-3xl font-bold">{studyHours} hrs</p>
                <p className="text-sm text-muted-foreground">Total completed hours</p>
              </div>

              <div className="bg-card rounded-2xl p-5 shadow-card">
                <p className="text-sm text-muted-foreground">Upcoming Classes</p>
                <div className="mt-3 space-y-3">
                  {upcomingClasses.length === 0 && <p className="text-sm text-muted-foreground">No upcoming classes</p>}
                  {upcomingClasses.map((uc) => (
                    <div key={uc.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{uc.subject}</p>
                        <p className="text-sm text-muted-foreground">{uc.teacher}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{uc.date} {uc.time}</p>
                        {uc.googleMeetLink && (
                          <a href={uc.googleMeetLink} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">Join</a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card rounded-2xl p-5 shadow-card">
                <p className="text-sm text-muted-foreground">Calendar</p>
                <div className="mt-3">
                  <div className="grid grid-cols-7 gap-1 text-xs text-center">
                    {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=> (
                      <div key={d} className="py-1 font-medium">{d}</div>
                    ))}
                  </div>
                  <div className="mt-2 grid grid-cols-7 gap-1 text-sm">
                    {/* Simple month grid showing events on their day */}
                    {Array.from({length: 35}).map((_, i) => {
                      const day = i + 1;
                      const dayEvents = calendarEvents.filter((ev:any)=> {
                        if (!ev.start) return false;
                        const d = new Date(ev.start).getDate();
                        return d === day;
                      });
                      return (
                        <div key={i} className={`h-10 sm:h-14 p-1 rounded-md ${dayEvents.length ? 'bg-muted/40' : 'bg-card'}`}>
                          <div className="text-xs text-muted-foreground">{day}</div>
                          {dayEvents.slice(0,2).map((ev:any)=> (
                            <div key={ev.id} className="text-xs truncate">• {ev.title}</div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Recommendations & Your Teachers */}
          <div>
            <div className="bg-card rounded-2xl shadow-card overflow-hidden mb-6">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h2 className="font-semibold text-lg">Recommended Classes</h2>
                <Button variant="ghost" size="sm">See All</Button>
              </div>
              <div className="p-4 space-y-4">
                {recommendations.length === 0 && <p className="text-sm text-muted-foreground">No recommendations yet.</p>}
                {recommendations.map((r:any) => (
                  <div key={r.id} className="flex items-start gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl gradient-hero flex items-center justify-center text-sm font-semibold text-primary-foreground">{(r.user?.firstName||'U').charAt(0)}</div>
                    <div className="flex-1">
                      <p className="font-medium truncate">{r.title}</p>
                      <p className="text-sm text-muted-foreground">{r.subject}</p>
                    </div>
                    <div>
                      <Button size="sm" variant="hero">View</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-2xl shadow-card overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h2 className="font-semibold text-lg">Your Teachers</h2>
                <Button variant="ghost" size="sm">View All</Button>
              </div>
              <div className="p-5 space-y-4">
                {recentTeachers.map((teacher) => (
                  <div key={teacher.id} className="flex items-center gap-3">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl gradient-hero flex items-center justify-center text-sm font-semibold text-primary-foreground">{(teacher.firstName||'T').charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{teacher.firstName} {teacher.lastName}</p>
                      <p className="text-sm text-muted-foreground">{(teacher.teacherProfile?.subjects||[]).slice(0,2).join(', ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        </>
        )}
      </>
    );
  };

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
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;

        // fetch user profile (to read interests)
        const meRes = await fetch(`${baseUrl}/api/users/me`, { headers });
        const me = meRes.ok ? await meRes.json() : null;

        // fetch teachers for 'Your Teachers' and recommendations
        const tRes = await fetch(`${baseUrl}/api/teachers`);
        if (tRes.ok) {
          const teachers = await tRes.json();
          setRecentTeachers(teachers.slice(0, 6));
        }

        // fetch bookings (upcoming & history)
        const bRes = await fetch(`${baseUrl}/api/bookings/student/${authUser.id}/upcoming`);
        if (bRes.ok) {
          const bookings = await bRes.json();

          // Enrolled Courses: confirmed / in-progress
          const enrolled = bookings.filter((b: any) => ['CONFIRMED','IN_PROGRESS','PAYMENT_COMPLETED'].includes(b.status));
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

          // Study hours: from completed bookings (completedAt or status COMPLETED)
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
          // fetch posts for first 3 interests
          for (const subject of interests.slice(0, 3)) {
            try {
              const pRes = await fetch(`${baseUrl}/api/posts?subject=${encodeURIComponent(subject)}`);
              if (pRes.ok) {
                const posts = await pRes.json();
                recs = recs.concat(posts);
              }
            } catch (e) {
              // ignore per-subject failures
            }
          }
        }
        // fallback: fetch general posts if none
        if (recs.length === 0) {
          const pRes = await fetch(`${baseUrl}/api/posts`);
          if (pRes.ok) recs = await pRes.json();
        }
        // dedupe and take 6
        const unique = Array.from(new Map(recs.map((r: any) => [r.id, r])).values()).slice(0, 6);
        setRecommendations(unique);

      } catch (err) {
        console.error('Error fetching dashboard data', err);
      }
    };

    fetchData();
  }, [authUser, token]);

  const handleLogout = async () => {
    try {
      await authLogout();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out. Redirecting to home...",
      });
      navigate("/", { replace: true });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to logout",
        variant: "destructive",
      });
    }
  };
  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6">
        <DashboardContent />
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
