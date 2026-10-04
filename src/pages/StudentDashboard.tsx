'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, Clock, BookOpen, Wallet, ArrowUpRight } from "lucide-react";
import MyClasses from '@/components/classes/MyClasses';
import ExploreContent from "@/components/explore/ExploreContent";
import EmailVerificationBanner from "@/components/auth/EmailVerificationBanner";
import { CurrencySettings } from "@/components/settings/CurrencySettings";
import { formatMoney, formatMoneyCompact } from "@/lib/currency";
import ScheduleCalendar from "@/components/calendar/ScheduleCalendar";
import MiniCalendar from "@/components/calendar/MiniCalendar";
import StudentWallet from "@/components/student/StudentWallet";
import StudentInquiries from "@/components/student/StudentInquiries";
import DashboardLayout, { useDashboard } from '@/components/layout/DashboardLayout';

import { useStudentDashboard } from "@/hooks/useStudentDashboard";
import { CustomizeWidgets, useWidgetPrefs, type WidgetDef } from "@/components/dashboard/CustomizeWidgets";

const STUDENT_WIDGETS: WidgetDef[] = [
  { id: "stats", label: "Key numbers", description: "Classes, learning time and wallet" },
  { id: "enrolled", label: "Enrolled courses" },
  { id: "upcoming", label: "Upcoming classes" },
  { id: "calendar", label: "Calendar" },
  { id: "foryou", label: "For you", description: "Recommended classes" },
  { id: "teachers", label: "Your teachers" },
];

// Defined at module level, not inside StudentDashboard: a component declared
// in another component's body is a new type on every render, so each data
// update remounted the whole tab, replaying the tile animations and
// refetching every child.
const DashboardContent = () => {
  const { activeTab } = useDashboard();
  const {
    upcomingClasses,
    recentTeachers,
    enrolledCourses,
    studyHours,
    completedCount,
    subjectCount,
    recommendations,
    calendarEvents,
    user,
    wallet
  } = useStudentDashboard();
  const { user: authUser } = useAuth();
  const currency = authUser?.currency;
  const router = useRouter();
  // Overview widgets the student can switch on and off.
  const widgetPrefs = useWidgetPrefs("miniuni.widgets.student");
  const show = widgetPrefs.isVisible;
  const showLeft = show("enrolled") || show("upcoming") || show("calendar");
  const showRight = show("foryou") || show("teachers");

  if (activeTab === 'explore') return <ExploreContent />;

  if (activeTab === 'schedule') return <ScheduleCalendar />;

  if (activeTab === 'wallet') return <StudentWallet />;

  if (activeTab === 'inquiries') return <StudentInquiries />;

  if (activeTab === 'classes') {
    return (
      <div className="space-y-6">
        <MyClasses />
      </div>
    );
  }

  if (activeTab === 'settings') {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Settings</h2>
          <p className="mt-1 text-sm text-muted-foreground">Manage your account and verification.</p>
        </div>
        <section className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Email verification</p>
          <EmailVerificationBanner variant="card" />
        </section>
        <section className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Currency</p>
          <div className="rounded-2xl border border-border/70 bg-card p-6">
            <CurrencySettings />
          </div>
        </section>
      </div>
    );
  }

  const stats = [
    { icon: Calendar, label: "Classes completed", value: completedCount },
    { icon: Clock, label: "Learning time", value: `${studyHours} hrs` },
    { icon: BookOpen, label: "Subjects studied", value: subjectCount },
    { icon: Wallet, label: "Wallet balance", value: formatMoneyCompact((wallet as any)?.releasedBalance, currency) },
  ];

  return (
    <>
      <div className="mb-4 flex justify-end">
        <CustomizeWidgets widgets={STUDENT_WIDGETS} {...widgetPrefs} />
      </div>

      {/* Separated stat tiles */}
      {show("stats") && (
      <div className="animate-fade-up mb-10 grid grid-cols-2 auto-rows-fr gap-4 lg:grid-cols-4 lg:gap-5" style={{ animationDelay: "0.1s" }}>
        {stats.map((stat, i) => {
          const featured = i === 0;
          return (
            <div
              key={stat.label}
              className={`group flex h-full flex-col rounded-3xl border p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card sm:p-6 ${featured
                ? "border-transparent gradient-hero text-primary-foreground"
                : "border-border/70 bg-card"
                }`}
            >
              <div className="mb-5 flex items-center justify-between">
                <stat.icon
                  className={`h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5 ${featured ? "text-primary-foreground/90" : "text-primary"}`}
                  strokeWidth={1.75}
                />
                <span className={`flex h-7 w-7 items-center justify-center rounded-full ${featured ? "bg-primary-foreground/15 text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="mt-auto truncate font-serif text-2xl leading-none tabular-nums sm:text-[1.75rem] xl:text-3xl" title={String(stat.value)}>{stat.value}</p>
              <p className={`mt-2 min-h-[2rem] text-xs uppercase leading-tight tracking-[0.14em] ${featured ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{stat.label}</p>
            </div>
          );
        })}
      </div>
      )}

      {(showLeft || showRight) && (
      <div className={`grid gap-6 [&>*]:min-w-0 ${showLeft && showRight ? "lg:grid-cols-3" : ""}`}>
        {/* Left: Enrolled Courses & secondary panels */}
        {showLeft && (
        <div className={`space-y-6 ${showRight ? "lg:col-span-2" : ""}`}>
          {show("enrolled") && (
          <section className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft">
            <div className="flex items-center justify-between border-b border-border/60 px-6 py-5">
              <h2 className="text-lg font-normal">
                Enrolled <span className="font-serif italic font-semibold">courses</span>
              </h2>
              <Button variant="ghost" size="sm" className="text-primary" onClick={() => router.push("/student/dashboard?tab=classes")}>Manage</Button>
            </div>
            <div className="divide-y divide-border/60">
              {enrolledCourses.length === 0 && (
                <p className="p-6 text-sm text-muted-foreground">You have no confirmed classes yet.</p>
              )}
              {enrolledCourses.map((c) => (
                <div key={c.id} className="flex flex-col items-start justify-between gap-3 px-6 py-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-medium">{c.subject}</p>
                    <p className="text-sm text-muted-foreground">with {c.teacher}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/15">{c.status}</Badge>
                    {c.googleMeetLink && (
                      <div className="mt-2">
                        <a href={c.googleMeetLink} target="_blank" rel="noreferrer" className="link-underline inline-flex items-center gap-1 text-sm text-primary">
                          Join Meet <ArrowUpRight className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
          )}

          {(show("upcoming") || show("calendar")) && (
          <div className={`grid grid-cols-1 gap-6 ${show("upcoming") && show("calendar") ? "md:grid-cols-2" : ""}`}>
            {show("upcoming") && (
            <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-soft">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Upcoming classes</h3>
              <div className="space-y-4">
                {upcomingClasses.length === 0 && <p className="text-sm text-muted-foreground">No upcoming classes</p>}
                {upcomingClasses.map((uc) => (
                  <div key={uc.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{uc.subject}</p>
                      <p className="truncate text-sm text-muted-foreground">{uc.teacher}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm">{uc.date} {uc.time}</p>
                      {uc.googleMeetLink && (
                        <a href={uc.googleMeetLink} target="_blank" rel="noreferrer" className="link-underline text-sm text-primary">Join</a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
            )}

            {show("calendar") && (
            <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-soft">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">This month</h3>
              <MiniCalendar
                events={calendarEvents as any}
                onSelectDate={() => router.push('/student/dashboard?tab=schedule')}
              />
            </section>
            )}
          </div>
          )}
        </div>
        )}

        {/* Right: Recommendations & Your Teachers */}
        {showRight && (
        <div className={showLeft ? "space-y-6" : "grid gap-6 lg:grid-cols-2"}>
          {show("foryou") && (
          <section className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft">
            <div className="flex items-center justify-between border-b border-border/60 px-6 py-5">
              <h2 className="text-lg font-normal">
                For <span className="font-serif italic font-semibold">you</span>
              </h2>
              <Button variant="ghost" size="sm" onClick={() => router.push("/student/dashboard?tab=explore")}>See All</Button>
            </div>
            <div className="space-y-5 p-6">
              {recommendations.length === 0 && <p className="text-sm text-muted-foreground">No recommendations yet.</p>}
              {recommendations.map((r: any) => (
                <div key={r.id} className="group flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full gradient-hero font-serif text-base italic text-primary-foreground">
                    {(r.user?.firstName || 'U').charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{r.title}</p>
                    <p className="truncate text-sm text-muted-foreground">{r.subject}</p>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0 opacity-70 transition-opacity group-hover:opacity-100" onClick={() => router.push(`/student/dashboard?tab=explore&post=${r.id}`)}>View</Button>
                </div>
              ))}
            </div>
          </section>
          )}

          {show("teachers") && (
          <section className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft">
            <div className="flex items-center justify-between border-b border-border/60 px-6 py-5">
              <h2 className="text-lg font-normal">
                Your <span className="font-serif italic font-semibold">teachers</span>
              </h2>
              <Button variant="ghost" size="sm" onClick={() => router.push("/student/dashboard?tab=classes")}>View All</Button>
            </div>
            <div className="space-y-4 p-6">
              {recentTeachers.length === 0 && <p className="text-sm text-muted-foreground">No teachers yet.</p>}
              {recentTeachers.map((teacher) => (
                <div key={teacher.id} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full gradient-hero font-serif text-sm italic text-primary-foreground">
                    {(teacher.firstName || 'T').charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{teacher.firstName} {teacher.lastName}</p>
                    <p className="truncate text-sm text-muted-foreground">{(teacher.teacherProfile?.subjects || []).slice(0, 2).join(', ')}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
          )}
        </div>
        )}
      </div>
      )}
    </>
  );
};

const StudentDashboard = () => {
  return (
    <DashboardLayout>
      <div className="px-5 py-8 sm:px-8 lg:px-10">
        {/* Stable top-level import — survives DashboardContent remounts so the OTP flow keeps its state */}
        <EmailVerificationBanner />
        <DashboardContent />
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
