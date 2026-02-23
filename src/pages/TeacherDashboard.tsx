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
  Video,
  Star,
  Users,
  ChevronRight,
  TrendingUp,
  DollarSign,
  CheckCircle,
  AlertCircle,
  FileText
} from "lucide-react";
import MyClasses from '@/components/classes/MyClasses';


const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [verification, setVerification] = useState<any>({ canStartClasses: false, progress: 0 });
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const { user: authUser, logout: authLogout, token } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    try {
      const u = localStorage.getItem("user");
      if (u) setUser(JSON.parse(u));
    } catch {
      setUser(null);
    }

    if (!token) return;

    const headers: any = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    const fetchAll = async () => {
      try {
        // verification progress
        const vRes = await fetch(`/api/teachers/verification-progress`, { headers });
        if (vRes.ok) setVerification(await vRes.json());

        // bookings for teacher
        if (authUser?.id) {
          const bRes = await fetch(`/api/bookings/teacher/${authUser.id}`);
          if (bRes.ok) {
            const data = await bRes.json();
            setBookings(data);
          }

          // inquiries
          const iRes = await fetch(`/api/inquiries/teacher/${authUser.id}`);
          if (iRes.ok) {
            const data = await iRes.json();
            setInquiries(data);
          }
        }

        // wallet for current user
        const wRes = await fetch(`/api/wallets/me`, { headers });
        if (wRes.ok) setWallet(await wRes.json());
      } catch (err) {
        console.error('Failed to fetch teacher dashboard data', err);
      }
    };

    fetchAll();
  }, [token, authUser?.id]);

  const handleLogout = async () => {
    try {
      await authLogout();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out. Redirecting to home...",
      });
      router.push("/", { replace: true });
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

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-card border-r border-border">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-warm flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-secondary-foreground" />
            </div>
            <span className="text-lg font-bold">MiniUni</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'settings') {
                  router.push('/teacher/onboarding');
                } else {
                  setActiveTab(item.id);
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id
                ? "gradient-warm text-secondary-foreground shadow-soft"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center text-primary-foreground font-semibold">
              {authUser?.firstName?.charAt(0)}{authUser?.lastName?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{authUser?.firstName} {authUser?.lastName}</p>
              <p className="text-sm text-muted-foreground truncate">{authUser?.role}</p>
            </div>
            <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
              <p className="text-muted-foreground">Manage your classes and connect with students.</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-secondary text-secondary-foreground text-xs flex items-center justify-center">
                  {inquiries.filter(i => !i.read).length}
                </span>
              </Button>
              <Button variant="warm" className="gap-2" disabled={verification?.verificationStatus !== 'APPROVED'}>
                <Plus className="w-4 h-4" />
                Create Offering
              </Button>
            </div>
          </div>
        </header>

        {/* Onboarding / Verification horizontal progress bar (clickable) */}
        <div className="bg-muted/20 border-b border-border">
          <div className="container mx-auto px-6 py-3">
            <button
              onClick={() => router.push('/teacher/onboarding')}
              className="w-full text-left focus:outline-none"
              aria-label="Open onboarding and verification"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 mr-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{verification?.progress ?? 0}% completed — {verification?.verificationStatus || 'Verification Pending'}</div>
                    <div className="text-xs text-muted-foreground">Classes cannot be started until verification is complete</div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3 mt-2 overflow-hidden">
                    <div className="h-3 bg-secondary" style={{ width: `${verification?.progress ?? 0}%` }} />
                  </div>
                </div>
                <div className="ml-4 text-sm text-primary font-medium">Complete onboarding</div>
              </div>
            </button>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-card rounded-2xl p-5 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-success" />
                </div>
                <Badge variant="secondary" className="bg-success/10 text-success">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +18%
                </Badge>
              </div>
              <p className="text-2xl font-bold">${wallet?.totalEarnings || 0}</p>
              <p className="text-sm text-muted-foreground">Total Earnings</p>
            </div>

            <div className="bg-card rounded-2xl p-5 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
              </div>
              <p className="text-2xl font-bold">${wallet?.pendingBalance || 0}</p>
              <p className="text-sm text-muted-foreground">Pending Balance</p>
            </div>

            <div className="bg-card rounded-2xl p-5 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="text-2xl font-bold">{bookings.length}</p>
              <p className="text-sm text-muted-foreground">Total Bookings</p>
            </div>

            <div className="bg-card rounded-2xl p-5 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <Star className="w-5 h-5 text-secondary" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">4.9</p>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Average Rating</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Upcoming Classes */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-2xl shadow-card overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <h2 className="font-semibold text-lg">Upcoming Classes</h2>
                  <Button variant="ghost" size="sm" className="text-primary">
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                <div className="p-5">
                  <MyClasses />
                </div>
              </div>
            </div>

            {/* Recent Inquiries */}
            <div className="bg-card rounded-2xl shadow-card overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h2 className="font-semibold text-lg">Recent Inquiries</h2>
                <Badge className="bg-secondary text-secondary-foreground">{inquiries.filter(i => !i.read).length || 'New'}</Badge>
              </div>
              <div className="p-5 space-y-4">
                {inquiries.length === 0 && <div className="text-sm text-muted-foreground">No inquiries yet</div>}
                {inquiries.map((inq) => (
                  <div key={inq.id} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${!inq.read ? 'bg-secondary' : 'bg-muted'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{inq.sender ? `${inq.sender.firstName} ${inq.sender.lastName}` : 'Student'}</p>
                      <p className="text-sm text-muted-foreground truncate">{inq.post?.title || inq.post?.subject || ''}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(inq.createdAt).toLocaleString()}</p>
                    </div>
                    <Button variant="ghost" size="sm">Reply</Button>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-border">
                <Button variant="outline" className="w-full">
                  View All Messages
                </Button>
              </div>
            </div>
          </div>

          {/* Wallet Summary */}
          <div className="mt-6 bg-gradient-to-r from-foreground to-foreground/90 rounded-2xl p-6 text-background">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">Your Wallet</h3>
                <p className="text-background/70 text-sm mb-4">Secure escrow-based payments</p>
                <div className="grid grid-cols-3 gap-8">
                  <div>
                    <p className="text-3xl font-bold">{wallet?.releasedBalance ? `$${wallet.releasedBalance}` : '$0'}</p>
                    <p className="text-sm text-background/70">Available</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{wallet?.pendingBalance ? `$${wallet.pendingBalance}` : '$0'}</p>
                    <p className="text-sm text-background/70">Pending</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{wallet?.totalEarnings ? `$${wallet.totalEarnings}` : '$0'}</p>
                    <p className="text-sm text-background/70">All Time</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button className="bg-background text-foreground hover:bg-background/90">Withdraw Funds</Button>
                <div className="bg-background/10 rounded-md p-3 text-sm text-background/90">
                  <div className="font-medium">Recent Transactions</div>
                  <div className="mt-2 space-y-2">
                    {(wallet?.transactions || []).slice(0, 3).map((t: any) => (
                      <div key={t.id} className="flex items-center justify-between text-sm">
                        <div>{t.type}</div>
                        <div className="font-medium">${t.amount}</div>
                      </div>
                    ))}
                    {(wallet?.transactions || []).length === 0 && <div className="text-xs text-background/70">No recent transactions</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;
