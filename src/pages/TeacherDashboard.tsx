import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  Home,
  Calendar,
  MessageSquare,
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

const upcomingClasses = [
  {
    id: 1,
    student: "Alex Johnson",
    avatar: "AJ",
    subject: "Calculus",
    topic: "Integration Techniques",
    date: "Today",
    time: "4:00 PM",
    duration: "1 hour",
    status: "confirmed",
    amount: 45
  },
  {
    id: 2,
    student: "Emma Wilson",
    avatar: "EW",
    subject: "Algebra",
    topic: "Linear Equations",
    date: "Tomorrow",
    time: "10:00 AM",
    duration: "1 hour",
    status: "pending",
    amount: 45
  }
];

const recentInquiries = [
  { id: 1, name: "Michael Brown", subject: "SAT Math Prep", time: "2 hours ago", status: "new" },
  { id: 2, name: "Sarah Lee", subject: "Calculus Tutoring", time: "5 hours ago", status: "read" },
  { id: 3, name: "David Kim", subject: "Algebra Help", time: "1 day ago", status: "replied" },
];

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const navItems = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "schedule", label: "Schedule", icon: Calendar },
    { id: "students", label: "Students", icon: Users },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "wallet", label: "Wallet", icon: Wallet },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-card border-r border-border">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-warm flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-secondary-foreground" />
            </div>
            <span className="text-lg font-bold">ClassConnect</span>
          </Link>
        </div>

        {/* Verification Status */}
        <div className="p-4 border-b border-border">
          <div className="bg-success/10 rounded-xl p-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success" />
            <span className="text-sm font-medium text-success">Verified Teacher</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id
                  ? "gradient-warm text-secondary-foreground shadow-soft"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
              {item.id === "messages" && (
                <Badge className="ml-auto bg-secondary text-secondary-foreground text-xs">3</Badge>
              )}
            </button>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center text-primary-foreground font-semibold">
              SM
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">Dr. Sarah Mitchell</p>
              <p className="text-sm text-muted-foreground">Mathematics</p>
            </div>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
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
                  5
                </span>
              </Button>
              <Button variant="warm" className="gap-2">
                <Plus className="w-4 h-4" />
                Create Offering
              </Button>
            </div>
          </div>
        </header>

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
              <p className="text-2xl font-bold">$2,450</p>
              <p className="text-sm text-muted-foreground">Total Earnings</p>
            </div>

            <div className="bg-card rounded-2xl p-5 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
              </div>
              <p className="text-2xl font-bold">$320</p>
              <p className="text-sm text-muted-foreground">Pending Balance</p>
            </div>

            <div className="bg-card rounded-2xl p-5 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="text-2xl font-bold">45</p>
              <p className="text-sm text-muted-foreground">Total Students</p>
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
                <div className="divide-y divide-border">
                  {upcomingClasses.map((cls) => (
                    <div key={cls.id} className="p-5 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-accent-foreground font-semibold">
                            {cls.avatar}
                          </div>
                          <div>
                            <h3 className="font-medium">{cls.topic}</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              with {cls.student} • {cls.subject}
                            </p>
                            <div className="flex items-center gap-3 text-sm">
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                {cls.date}
                              </span>
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                {cls.time}
                              </span>
                              <span className="flex items-center gap-1 text-success font-medium">
                                <DollarSign className="w-4 h-4" />
                                ${cls.amount}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={`border-0 ${
                            cls.status === "confirmed" 
                              ? "bg-success/10 text-success" 
                              : "bg-warning/10 text-warning"
                          }`}>
                            {cls.status}
                          </Badge>
                          <Button variant="warm" size="sm">
                            <Video className="w-4 h-4 mr-1" />
                            Start Class
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Inquiries */}
            <div className="bg-card rounded-2xl shadow-card overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h2 className="font-semibold text-lg">Recent Inquiries</h2>
                <Badge className="bg-secondary text-secondary-foreground">3 new</Badge>
              </div>
              <div className="p-5 space-y-4">
                {recentInquiries.map((inquiry) => (
                  <div key={inquiry.id} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      inquiry.status === "new" ? "bg-secondary" : "bg-muted"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{inquiry.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{inquiry.subject}</p>
                      <p className="text-xs text-muted-foreground mt-1">{inquiry.time}</p>
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
                    <p className="text-3xl font-bold">$2,130</p>
                    <p className="text-sm text-background/70">Available</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">$320</p>
                    <p className="text-sm text-background/70">Pending</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">$8,540</p>
                    <p className="text-sm text-background/70">All Time</p>
                  </div>
                </div>
              </div>
              <Button className="bg-background text-foreground hover:bg-background/90">
                Withdraw Funds
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;
