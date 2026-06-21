/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  GraduationCap,
  Home,
  Search,
  Calendar,
  BookOpen,
  Wallet,
  Settings,
  Bell,
  LogOut,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type DashboardContextType = {
  activeTab: string;
  setActiveTab: (t: string) => void;
};

const DashboardContext = createContext<DashboardContextType>({
  activeTab: "overview",
  setActiveTab: () => { },
});

export const useDashboard = () => useContext(DashboardContext);

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

const todayLabel = () =>
  new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

const DashboardLayout: React.FC<PropsWithChildren> = ({ children }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [moreOpen, setMoreOpen] = useState(false);
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const t = searchParams?.get("tab");
    if (t) setActiveTab(t);
  }, [searchParams]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: "Logged out successfully", description: "Redirecting..." });
      router.push("/", { scroll: false });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Logout failed", variant: "destructive" });
    }
  };

  const navItems = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "explore", label: "Explore", icon: Search },
    { id: "schedule", label: "Schedule", icon: Calendar },
    { id: "classes", label: "Classes", icon: BookOpen },
    { id: "wallet", label: "Wallet", icon: Wallet },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const goTab = (id: string) => {
    setActiveTab(id);
    router.push(`/student/dashboard?tab=${id}`);
  };

  return (
    <DashboardContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="min-h-screen bg-background lg:flex">
        {/* Desktop — floating studio sidebar */}
        <aside className="hidden lg:flex sticky top-0 h-screen w-[252px] shrink-0 flex-col p-4">
          <div className="flex h-full flex-col rounded-3xl border border-border/70 bg-card/80 shadow-card backdrop-blur-xl grain relative overflow-hidden">
            <div className="p-6 pb-4">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-hero">
                  <GraduationCap className="h-5 w-5 text-primary-foreground" />
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
                      ? "bg-primary text-primary-foreground shadow-soft"
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
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full gradient-hero text-sm font-semibold text-primary-foreground">
                  {user ? `${(user.firstName || "").charAt(0)}${(user.lastName || "").charAt(0)}` : "S"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{user ? `${user.firstName} ${user.lastName}` : "Student"}</p>
                  <p className="text-xs text-muted-foreground">Student</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-muted-foreground transition-colors hover:text-destructive"
                  title="Logout"
                >
                  <LogOut className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col pb-24 lg:pb-0">
          {/* Editorial greeting header */}
          <header className="px-5 pt-8 sm:px-8 lg:px-10 lg:pt-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="animate-fade-up">
                <p className="mb-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{todayLabel()}</p>
                <h1 className="text-3xl sm:text-4xl font-semibold leading-tight">
                  {greeting()},{" "}
                  <span className="font-serif italic font-normal text-gradient">{user?.firstName || "Student"}.</span>
                </h1>
              </div>
              <div className="flex items-center gap-2.5">
                <Button variant="ghost" size="icon" className="relative rounded-full border border-border/70 bg-card">
                  <Bell className="h-[18px] w-[18px]" />
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-secondary-foreground">3</span>
                </Button>
                <Button variant="hero" className="gap-2" asChild>
                  <Link href="/teachers">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Find Teacher</span>
                    <span className="sm:hidden">Find</span>
                  </Link>
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1">{children}</main>
        </div>

        {/* Mobile — bottom dock */}
        <nav className="fixed inset-x-4 bottom-4 z-50 lg:hidden">
          <div className="flex items-center justify-around gap-1 rounded-full border border-border/70 bg-card/90 px-3 py-2 shadow-elevated backdrop-blur-xl">
            {navItems.filter((i) => i.id === "overview" || i.id === "schedule").map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => goTab(item.id)}
                  className={`flex flex-col items-center gap-0.5 rounded-full px-4 py-1.5 transition-all duration-300 ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                  aria-label={item.label}
                >
                  <item.icon className="h-5 w-5" strokeWidth={1.75} />
                  <span className="text-[9px] font-medium">{item.label}</span>
                </button>
              );
            })}

            <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
              <SheetTrigger asChild>
                <button
                  className={`flex flex-col items-center gap-0.5 rounded-full px-4 py-1.5 transition-all duration-300 ${!["overview", "schedule"].includes(activeTab) ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                  aria-label="More"
                >
                  <MoreHorizontal className="h-5 w-5" strokeWidth={1.75} />
                  <span className="text-[9px] font-medium">More</span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-3xl">
                <SheetHeader className="text-left">
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="mt-4 grid grid-cols-3 gap-3 pb-4">
                  {navItems.filter((i) => i.id !== "overview" && i.id !== "schedule").map((item) => {
                    const active = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { goTab(item.id); setMoreOpen(false); }}
                        className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition-colors ${active ? "border-primary bg-primary/[0.06] text-primary" : "border-border/70 text-foreground hover:bg-muted/50"}`}
                      >
                        <item.icon className="h-5 w-5" strokeWidth={1.75} />
                        <span className="text-xs font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    </DashboardContext.Provider>
  );
};

export default DashboardLayout;
