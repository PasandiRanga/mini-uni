import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  Home,
  Search,
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
  BookOpen,
  ChevronRight,
  TrendingUp
} from "lucide-react";

const upcomingClasses = [
  {
    id: 1,
    teacher: "Dr. Sarah Mitchell",
    subject: "Mathematics",
    topic: "Calculus - Integration Techniques",
    date: "Today",
    time: "4:00 PM",
    duration: "1 hour",
    status: "confirmed"
  },
  {
    id: 2,
    teacher: "James Chen",
    subject: "Physics",
    topic: "Mechanics - Newton's Laws",
    date: "Tomorrow",
    time: "2:30 PM",
    duration: "1.5 hours",
    status: "confirmed"
  }
];

const recentTeachers = [
  { id: 1, name: "Dr. Sarah Mitchell", subject: "Mathematics", avatar: "SM", rating: 4.9 },
  { id: 2, name: "James Chen", subject: "Physics", avatar: "JC", rating: 4.8 },
  { id: 3, name: "Maria Garcia", subject: "Spanish", avatar: "MG", rating: 5.0 },
];

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const navItems = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "explore", label: "Explore", icon: Search },
    { id: "classes", label: "My Classes", icon: Calendar },
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
            <div className="w-9 h-9 rounded-xl gradient-hero flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">ClassConnect</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id
                  ? "bg-primary text-primary-foreground shadow-soft"
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
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-accent-foreground font-semibold">
              AJ
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">Alex Johnson</p>
              <p className="text-sm text-muted-foreground">Student</p>
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
              <h1 className="text-2xl font-bold">Welcome back, Alex!</h1>
              <p className="text-muted-foreground">Here's what's happening with your classes.</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-secondary text-secondary-foreground text-xs flex items-center justify-center">
                  3
                </span>
              </Button>
              <Button variant="hero" className="gap-2" asChild>
                <Link to="/feed">
                  <Plus className="w-4 h-4" />
                  Find Teacher
                </Link>
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
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <Badge variant="secondary" className="bg-success/10 text-success">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12%
                </Badge>
              </div>
              <p className="text-2xl font-bold">24</p>
              <p className="text-sm text-muted-foreground">Classes Completed</p>
            </div>

            <div className="bg-card rounded-2xl p-5 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-accent" />
                </div>
              </div>
              <p className="text-2xl font-bold">36 hrs</p>
              <p className="text-sm text-muted-foreground">Total Learning Time</p>
            </div>

            <div className="bg-card rounded-2xl p-5 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-secondary" />
                </div>
              </div>
              <p className="text-2xl font-bold">5</p>
              <p className="text-sm text-muted-foreground">Subjects Studied</p>
            </div>

            <div className="bg-card rounded-2xl p-5 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-warning" />
                </div>
              </div>
              <p className="text-2xl font-bold">$245</p>
              <p className="text-sm text-muted-foreground">Wallet Balance</p>
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
                          <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center">
                            <Video className="w-6 h-6 text-primary-foreground" />
                          </div>
                          <div>
                            <h3 className="font-medium">{cls.topic}</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              with {cls.teacher} • {cls.subject}
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
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className="bg-success/10 text-success border-0">
                            {cls.status}
                          </Badge>
                          <Button variant="hero" size="sm">
                            Join Class
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Teachers */}
            <div className="bg-card rounded-2xl shadow-card overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h2 className="font-semibold text-lg">Your Teachers</h2>
                <Button variant="ghost" size="sm" className="text-primary">
                  View All
                </Button>
              </div>
              <div className="p-5 space-y-4">
                {recentTeachers.map((teacher) => (
                  <div key={teacher.id} className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl gradient-hero flex items-center justify-center text-sm font-semibold text-primary-foreground">
                      {teacher.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{teacher.name}</p>
                      <p className="text-sm text-muted-foreground">{teacher.subject}</p>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="w-4 h-4 fill-warning text-warning" />
                      {teacher.rating}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
