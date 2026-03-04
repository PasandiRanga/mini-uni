/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
  Plus
  , Menu, X
} from "lucide-react";

type DashboardContextType = {
  activeTab: string;
  setActiveTab: (t: string) => void;
};

const DashboardContext = createContext<DashboardContextType>({
  activeTab: "overview",
  setActiveTab: () => { },
});

export const useDashboard = () => useContext(DashboardContext);

const DashboardLayout: React.FC<PropsWithChildren> = ({ children }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      const u = localStorage.getItem("user");
      if (u) {
        // keep local storage user for avatar initials in sidebar
      }
    } catch (e) {
      // ignore
    }
  }, []);

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
    { id: "classes", label: "My Classes", icon: Calendar },
    { id: "wallet", label: "Wallet", icon: Wallet },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <DashboardContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="min-h-screen bg-background flex">
        <aside className="hidden lg:flex flex-col w-64 bg-card border-r border-border">
          <div className="p-6 border-b border-border">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl gradient-hero flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">MiniUni</span>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  router.push(`/student/dashboard?tab=${item.id}`);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-accent-foreground font-semibold">
                {user ? `${(user.firstName || "").charAt(0)}${(user.lastName || "").charAt(0)}` : "SJ"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user ? `${user.firstName} ${user.lastName}` : "Student"}</p>
                <p className="text-sm text-muted-foreground">Student</p>
              </div>
              <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground transition-colors" title="Logout">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
                  <Menu className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">Welcome back, {user ? user.firstName : 'Student'}!</h1>
                  <p className="text-muted-foreground">Here's what's happening with your classes.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-secondary text-secondary-foreground text-xs flex items-center justify-center">3</span>
                </Button>
                <Button variant="hero" className="gap-2" asChild>
                  <Link href="/teachers">
                    <Plus className="w-4 h-4" />
                    Find Teacher
                  </Link>
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
        {/* Mobile off-canvas sidebar */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
            <aside className="relative w-64 h-full bg-card border-r border-border">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl gradient-hero flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="text-lg font-bold">MiniUni</span>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <nav className="p-4 space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileOpen(false);
                      router.push(`/student/dashboard?tab=${item.id}`);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>

              <div className="p-4 border-t border-border">
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-accent-foreground font-semibold">
                    {user ? `${(user.firstName || "").charAt(0)}${(user.lastName || "").charAt(0)}` : "SJ"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user ? `${user.firstName} ${user.lastName}` : "Student"}</p>
                    <p className="text-sm text-muted-foreground">Student</p>
                  </div>
                  <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground transition-colors" title="Logout">
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </DashboardContext.Provider>
  );
};

export default DashboardLayout;
