'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, Clock, CalendarClock, Wallet, ArrowUpRight } from "lucide-react";
import MyClasses from '@/components/classes/MyClasses';
import ExploreContent from "@/components/explore/ExploreContent";
import EmailVerificationBanner from "@/components/auth/EmailVerificationBanner";
import { CurrencySettings } from "@/components/settings/CurrencySettings";
import { PasswordSettings } from "@/components/settings/PasswordSettings";
import { formatMoneyCompact } from "@/lib/currency";
import ScheduleCalendar from "@/components/calendar/ScheduleCalendar";
import MiniCalendar from "@/components/calendar/MiniCalendar";
import StudentWallet from "@/components/student/StudentWallet";
import StudentInquiries from "@/components/student/StudentInquiries";
import DashboardLayout, { useDashboard } from '@/components/layout/DashboardLayout';

import { useStudentDashboard } from "@/hooks/useStudentDashboard";
import { CustomizeWidgets, useWidgetPrefs, type WidgetDef } from "@/components/dashboard/CustomizeWidgets";

const STUDENT_WIDGETS: WidgetDef[] = [
  { id: "stats", label: "Key numbers", description: "Classes and wallet" },
  { id: "upcoming", label: "Upcoming classes" },
  { id: "calendar", label: "Calendar" },
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
    completedCount,
    calendarEvents,
    user,
    wallet,
    loading: statsLoading,
  } = useStudentDashboard();
  const { user: authUser } = useAuth();
  const currency = authUser?.currency;
  const router = useRouter();
  // Overview widgets the student can switch on and off.
  const widgetPrefs = useWidgetPrefs("miniuni.widgets.student");
  const show = widgetPrefs.isVisible;
  const showLeft = show("upcoming") || show("calendar");
  const showRight = show("teachers");

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
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h2 className="type-title">Settings</h2>
          <p className="mt-1 text-sm text-muted-foreground">Manage your account and verification.</p>
        </div>
        <section className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Email verification</p>
          <EmailVerificationBanner variant="card" />
        </section>
        <section className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Password</p>
          <div className="rounded-2xl border border-border/70 bg-card p-6">
            <PasswordSettings />
          </div>
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

  // Until the first load lands, show a dash rather than a misleading 0.
  const pending = (v: string | number) => (statsLoading ? "–" : v);
  const stats = [
    { icon: Calendar, label: "Classes completed", value: pending(completedCount) },
    { icon: CalendarClock, label: "Upcoming classes", value: pending(upcomingClasses.length) },
    { icon: Wallet, label: "Wallet balance", value: pending(formatMoneyCompact((wallet as any)?.releasedBalance, currency)) },
    // Paid for classes still to come (or under review); see StudentWallet.
    { icon: Clock, label: "On hold", value: pending(formatMoneyCompact((wallet as any)?.heldAmount ?? 0, currency)) },
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
              <p className={`mt-auto truncate font-serif leading-none tabular-nums ${String(stat.value).length > 7 ? "text-xl sm:text-2xl xl:text-[1.75rem]" : "text-2xl sm:text-[1.75rem] xl:text-3xl"}`} title={String(stat.value)}>{stat.value}</p>
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
          {(show("upcoming") || show("calendar")) && (
          <div className={`grid grid-cols-1 gap-6 ${show("upcoming") && show("calendar") ? "md:grid-cols-2" : ""}`}>
            {show("upcoming") && (
            <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-soft">
              <h3 className="type-eyebrow mb-4">Upcoming classes</h3>
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
              <h3 className="type-eyebrow mb-4">This month</h3>
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
          {show("teachers") && (
          <section className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft">
            <div className="flex items-center justify-between border-b border-border/60 px-6 py-5">
              <h2 className="type-section">
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
