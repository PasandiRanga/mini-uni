'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  GraduationCap,
  Home,
  Calendar,
  Wallet,
  Settings,
  Bell,
  LogOut,
  Plus,
  Clock,
  Star,
  Users,
  DollarSign,
  ChevronRight,
} from "lucide-react";
import MyClasses from '@/components/classes/MyClasses';
import EmailVerificationBanner from "@/components/auth/EmailVerificationBanner";
import TeacherSettings from "@/components/teacher/TeacherSettings";

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

const todayLabel = () =>
  new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [verification, setVerification] = useState<any>({ canStartClasses: false, progress: 0 });
  const [completion, setCompletion] = useState<{ percent: number; verificationStatus?: string } | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const { user, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // verification progress
        const vRes = await fetch(`/api/teachers/verification-progress`);
        if (vRes.ok) setVerification(await vRes.json());

        // profile completion (drives the "Complete your profile" banner)
        const cRes = await fetch(`/api/teachers/profile-completion`);
        if (cRes.ok) setCompletion(await cRes.json());

        // bookings for teacher
        if (user?.id) {
          const bRes = await fetch(`/api/bookings/teacher/${user.id}`);
          if (bRes.ok) {
            const data = await bRes.json();
            setBookings(data);
          }

          // inquiries
          const iRes = await fetch(`/api/inquiries/teacher/${user.id}`);
          if (iRes.ok) {
            const data = await iRes.json();
            setInquiries(data);
          }
        }

        // wallet for current user
        const wRes = await fetch(`/api/wallets/me`);
        if (wRes.ok) setWallet(await wRes.json());
      } catch (err) {
        console.error('Failed to fetch teacher dashboard data', err);
      }
    };

    fetchAll();
  }, [user?.id]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out. Redirecting to home...",
      });
      router.replace("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to logout",
        variant: "destructive",
      });
    }
  };

  const navItems = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "schedule", label: "Schedule", icon: Calendar },
    { id: "students", label: "Students", icon: Users },
    { id: "wallet", label: "Wallet", icon: Wallet },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const goTab = (id: string) => {
    setActiveTab(id);
  };

  const unreadCount = inquiries.filter(i => !i.read).length;

  const stats = [
    { icon: DollarSign, label: "Total earnings", value: `$${wallet?.totalEarnings || 0}` },
    { icon: Clock, label: "Pending balance", value: `$${wallet?.pendingBalance || 0}` },
    { icon: Users, label: "Total bookings", value: bookings.length },
    { icon: Star, label: "Average rating", value: "4.9" },
  ];

  return (
    <div className="min-h-screen bg-background lg:flex">
      {/* Desktop — floating studio sidebar */}
      <aside className="hidden lg:flex sticky top-0 h-screen w-[252px] shrink-0 flex-col p-4">
        <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-border/70 bg-card/80 shadow-card backdrop-blur-xl grain">
          <div className="p-6 pb-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-warm">
                <GraduationCap className="h-5 w-5 text-secondary-foreground" />
              </div>
              <span className="text-lg font-semibold tracking-tight">
                Mini<span className="font-serif italic font-normal">Uni</span>
              </span>
            </Link>
          </div>

          <nav className="flex-1 space-y-1 px-3">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => goTab(item.id)}
                  className={`group relative flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-sm transition-all duration-300 ${active
                    ? "bg-secondary text-secondary-foreground shadow-soft"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                    }`}
                >
                  <item.icon className={`h-[18px] w-[18px] transition-transform duration-300 ${active ? "" : "group-hover:-translate-y-0.5"}`} strokeWidth={1.75} />
                  <span className="font-medium">{item.label}</span>
                  {active && <span className="absolute right-3.5 h-1.5 w-1.5 rounded-full bg-accent" />}
                </button>
              );
            })}
          </nav>

          <div className="p-4">
            <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/60 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full gradient-warm text-sm font-semibold text-secondary-foreground">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-muted-foreground">Teacher</p>
              </div>
              <button onClick={handleLogout} className="text-muted-foreground transition-colors hover:text-destructive" title="Logout">
                <LogOut className="h-[18px] w-[18px]" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <main className="flex min-w-0 flex-1 flex-col pb-24 lg:pb-0">
        {/* Editorial greeting header */}
        <header className="px-5 pt-8 sm:px-8 lg:px-10 lg:pt-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="animate-fade-up">
              <p className="mb-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{todayLabel()}</p>
              <h1 className="text-3xl sm:text-4xl font-semibold leading-tight">
                {greeting()},{" "}
                <span className="font-serif italic font-normal text-gradient">{user?.firstName || "Teacher"}.</span>
              </h1>
            </div>
            <div className="flex items-center gap-2.5">
              <Button variant="ghost" size="icon" className="relative rounded-full border border-border/70 bg-card">
                <Bell className="h-[18px] w-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-secondary-foreground">
                    {unreadCount}
                  </span>
                )}
              </Button>
              <Button variant="warm" className="gap-2" disabled={verification?.verificationStatus !== 'APPROVED'}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create Offering</span>
                <span className="sm:hidden">Create</span>
              </Button>
            </div>
          </div>
        </header>

        <div className="px-5 py-8 sm:px-8 lg:px-10">
          {activeTab === "settings" ? (
            <TeacherSettings />
          ) : (
          <>
          <EmailVerificationBanner />

          {/* Complete-your-profile banner — fills as the teacher completes the wizard steps */}
          {completion && completion.percent < 100 && (
            <button
              onClick={() => router.push('/teacher/profile-completion')}
              className="group mb-8 block w-full overflow-hidden rounded-3xl border border-secondary/40 bg-secondary/[0.07] p-5 text-left transition-all duration-300 hover:border-secondary/70 hover:bg-secondary/10 sm:p-6"
              aria-label="Complete your profile"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">
                    Complete your <span className="font-serif italic">profile</span> — {completion.percent}% done
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">Finish your personal, identity and academic details to start teaching.</p>
                </div>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-secondary">
                  Continue <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </span>
              </div>
              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-border/70">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-secondary to-accent transition-all duration-700"
                  style={{ width: `${completion.percent}%` }}
                />
              </div>
            </button>
          )}

          {/* Submitted — pending admin approval (profile fully complete, not yet approved) */}
          {completion && completion.percent === 100 && completion.verificationStatus === 'PENDING' && (
            <div className="mb-8 overflow-hidden rounded-3xl border border-warning/40 bg-warning/[0.08] p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning/15 text-warning">
                  <Clock className="h-[18px] w-[18px]" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="font-medium">
                    Profile submitted — <span className="font-serif italic">pending approval</span>
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Our team is reviewing your details. You&apos;ll be able to create classes once your profile is approved.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Rejected — needs changes */}
          {completion && completion.verificationStatus === 'REJECTED' && (
            <button
              onClick={() => router.push('/teacher/profile-completion')}
              className="group mb-8 block w-full overflow-hidden rounded-3xl border border-destructive/40 bg-destructive/[0.07] p-5 text-left transition-all duration-300 hover:border-destructive/70 hover:bg-destructive/10 sm:p-6"
              aria-label="Review your profile"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">
                    Verification <span className="font-serif italic">needs changes</span>
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Your profile couldn&apos;t be approved. Please review your details and documents, then resubmit.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-destructive">
                  Review profile <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </span>
              </div>
            </button>
          )}

          {/* Ledger stat strip */}
          <div className="animate-fade-up mb-10 grid grid-cols-2 overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft lg:grid-cols-4" style={{ animationDelay: "0.1s" }}>
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className={`group p-5 sm:p-7 transition-colors duration-300 hover:bg-muted/50 ${i % 2 === 1 ? "border-l border-border/60" : ""} ${i >= 2 ? "border-t border-border/60 lg:border-t-0 lg:border-l" : ""}`}
              >
                <stat.icon className="mb-4 h-5 w-5 text-secondary transition-transform duration-300 group-hover:-translate-y-0.5" strokeWidth={1.75} />
                <p className="font-serif text-3xl italic leading-none sm:text-4xl">{stat.value}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Upcoming Classes */}
            <section className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft lg:col-span-2">
              <div className="flex items-center justify-between border-b border-border/60 px-6 py-5">
                <h2 className="text-lg font-semibold">
                  Upcoming <span className="font-serif italic font-normal">classes</span>
                </h2>
                <Button variant="ghost" size="sm" className="text-primary">
                  View All
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
              <div className="p-6">
                <MyClasses />
              </div>
            </section>

            {/* Recent Inquiries */}
            <section className="flex flex-col overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft">
              <div className="flex items-center justify-between border-b border-border/60 px-6 py-5">
                <h2 className="text-lg font-semibold">
                  <span className="font-serif italic font-normal">Inquiries</span>
                </h2>
                {unreadCount > 0 && (
                  <Badge className="rounded-full bg-secondary text-secondary-foreground">{unreadCount} new</Badge>
                )}
              </div>
              <div className="flex-1 space-y-5 p-6">
                {inquiries.length === 0 && <p className="text-sm text-muted-foreground">No inquiries yet</p>}
                {inquiries.map((inq) => (
                  <div key={inq.id} className="flex items-start gap-3">
                    <div className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${!inq.read ? 'bg-secondary' : 'bg-border'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{inq.sender ? `${inq.sender.firstName} ${inq.sender.lastName}` : 'Student'}</p>
                      <p className="truncate text-sm text-muted-foreground">{inq.post?.title || inq.post?.subject || ''}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{new Date(inq.createdAt).toLocaleString()}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="shrink-0">Reply</Button>
                  </div>
                ))}
              </div>
              <div className="border-t border-border/60 p-4">
                <Button variant="outline" className="w-full">View All Messages</Button>
              </div>
            </section>
          </div>

          {/* Wallet — ink card */}
          <div className="relative mt-6 overflow-hidden rounded-3xl bg-foreground p-7 text-background shadow-elevated grain sm:p-9">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-secondary/20 blur-3xl" />
            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-background/50">Your wallet</p>
                <h3 className="mb-6 font-serif text-2xl italic text-background/90">Secure, escrow-based payments.</h3>
                <div className="grid grid-cols-3 gap-6 sm:gap-10">
                  <div>
                    <p className="font-serif text-3xl italic sm:text-4xl">${wallet?.releasedBalance || 0}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-background/60">Available</p>
                  </div>
                  <div>
                    <p className="font-serif text-3xl italic sm:text-4xl">${wallet?.pendingBalance || 0}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-background/60">Pending</p>
                  </div>
                  <div>
                    <p className="font-serif text-3xl italic sm:text-4xl">${wallet?.totalEarnings || 0}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-background/60">All time</p>
                  </div>
                </div>
              </div>
              <div className="flex w-full flex-col gap-3 lg:w-72">
                <Button className="w-full bg-background text-foreground hover:bg-background/90">Withdraw Funds</Button>
                <div className="rounded-2xl border border-background/15 bg-background/5 p-4 text-sm">
                  <p className="font-medium text-background/90">Recent transactions</p>
                  <div className="mt-3 space-y-2.5">
                    {(wallet?.transactions || []).slice(0, 3).map((t: any) => (
                      <div key={t.id} className="flex items-center justify-between text-sm text-background/75">
                        <span>{t.type}</span>
                        <span className="font-medium text-background/90">${t.amount}</span>
                      </div>
                    ))}
                    {(wallet?.transactions || []).length === 0 && (
                      <p className="text-xs text-background/50">No recent transactions</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          </>
          )}
        </div>
      </main>

      {/* Mobile — bottom dock */}
      <nav className="fixed inset-x-4 bottom-4 z-50 lg:hidden">
        <div className="flex items-center justify-around rounded-full border border-border/70 bg-card/90 px-2 py-2 shadow-elevated backdrop-blur-xl">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => goTab(item.id)}
                className={`flex flex-col items-center gap-0.5 rounded-full px-3.5 py-1.5 transition-all duration-300 ${active ? "bg-secondary text-secondary-foreground" : "text-muted-foreground"
                  }`}
                aria-label={item.label}
              >
                <item.icon className="h-5 w-5" strokeWidth={1.75} />
                <span className={`text-[9px] font-medium ${active ? "" : "sr-only"}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default TeacherDashboard;
