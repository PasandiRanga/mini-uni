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
  MessageSquare,
  LogOut,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import NotificationBell from "@/components/notifications/NotificationBell";
import AppSidebar, { type SidebarSection } from "@/components/layout/AppSidebar";

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
    { id: "inquiries", label: "Inquiries", icon: MessageSquare },
    { id: "wallet", label: "Wallet", icon: Wallet },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const goTab = (id: string) => {
    setActiveTab(id);
    router.push(`/student/dashboard?tab=${id}`);
  };

  // Same links as the mobile dock, grouped for the desktop sidebar.
  const byId = (id: string) => navItems.find((i) => i.id === id)!;
  const sidebarSections: SidebarSection[] = [
    { items: [byId("overview")] },
    { label: "Learning", items: [byId("classes"), byId("schedule")] },
    { label: "Community", items: [byId("explore"), byId("inquiries")] },
    { label: "Account", items: [byId("wallet"), byId("settings")] },
  ];

  return (
    <DashboardContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="min-h-screen bg-background lg:flex">
        {/* Desktop sidebar (phones use the bottom dock below) */}
        <AppSidebar
          sections={sidebarSections}
          activeId={activeTab}
          onSelect={goTab}
          user={user}
          roleLabel="Student"
          onLogout={handleLogout}
        />

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
                <NotificationBell />
                {user?.role === "STUDENT" && (
                  <Button variant="hero" className="gap-2" asChild>
                    <Link href="/teachers">
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">Find Teacher</span>
                      <span className="sm:hidden">Find</span>
                    </Link>
                  </Button>
                )}
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
                {/* The sidebar (and its logout) is hidden on phones, so offer it here. */}
                <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{`${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "Signed in"}</p>
                    <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => { setMoreOpen(false); handleLogout(); }}
                  >
                    <LogOut className="h-4 w-4" /> Log out
                  </Button>
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
