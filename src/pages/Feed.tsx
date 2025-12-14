import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  MapPin, 
  Star, 
  Clock, 
  DollarSign,
  BookOpen,
  GraduationCap,
  MessageCircle,
  Heart,
  Share2,
  ChevronDown,
  Plus
} from "lucide-react";

// Mock data for the feed
const mockTeacherPosts = [
  {
    id: 1,
    type: "teacher",
    name: "Dr. Sarah Mitchell",
    avatar: "SM",
    verified: true,
    subject: "Mathematics",
    title: "Expert Calculus & Algebra Tutoring",
    description: "Specialized in AP Calculus, SAT Math prep, and college-level algebra. 8+ years of teaching experience with a proven track record of student success.",
    hourlyRate: 45,
    rating: 4.9,
    reviews: 127,
    location: "San Francisco, CA",
    availability: "Mon-Fri, 3PM-8PM",
    tags: ["Calculus", "Algebra", "SAT Prep"],
    postedAt: "2 hours ago"
  },
  {
    id: 2,
    type: "teacher",
    name: "James Chen",
    avatar: "JC",
    verified: true,
    subject: "Physics",
    title: "Physics Made Simple - All Levels",
    description: "Making physics fun and understandable! I cover AP Physics, IB Physics, and introductory college physics. Hands-on approach with real-world examples.",
    hourlyRate: 55,
    rating: 4.8,
    reviews: 89,
    location: "Los Angeles, CA",
    availability: "Weekends, Flexible",
    tags: ["AP Physics", "IB Physics", "Mechanics"],
    postedAt: "5 hours ago"
  },
  {
    id: 3,
    type: "student",
    name: "Alex Johnson",
    avatar: "AJ",
    subject: "Chemistry",
    title: "Looking for Chemistry Tutor - Grade 11",
    description: "Need help with organic chemistry and balancing equations. Preparing for finals and could use someone patient who can explain concepts clearly.",
    budget: "30-40/hr",
    location: "Online",
    schedule: "Evenings preferred",
    tags: ["Organic Chemistry", "Grade 11", "Finals Prep"],
    postedAt: "1 hour ago"
  },
  {
    id: 4,
    type: "teacher",
    name: "Maria Garcia",
    avatar: "MG",
    verified: true,
    subject: "Spanish",
    title: "Native Spanish Speaker - All Levels Welcome",
    description: "Learn Spanish from a native speaker! I teach conversational Spanish, business Spanish, and help with DELE exam preparation. ¡Vamos a aprender juntos!",
    hourlyRate: 35,
    rating: 5.0,
    reviews: 64,
    location: "Miami, FL",
    availability: "Flexible Schedule",
    tags: ["Conversational", "Business Spanish", "DELE"],
    postedAt: "3 hours ago"
  }
];

const subjects = ["All Subjects", "Mathematics", "Physics", "Chemistry", "Biology", "English", "Spanish", "History", "Computer Science"];

const Feed = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All Subjects");
  const [postType, setPostType] = useState<"all" | "teachers" | "students">("all");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
        {/* Header */}
        <div className="bg-muted/30 border-b border-border">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-3xl mx-auto text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold mb-4">
                Explore <span className="font-serif italic text-gradient">Classes</span>
              </h1>
              <p className="text-muted-foreground">
                Browse teacher offerings or student requests. Find your perfect match.
              </p>
            </div>

            {/* Search and Filters */}
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by subject, topic, or teacher name..."
                    className="pl-12 h-12 text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="lg" className="gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="lg" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Filters
                </Button>
              </div>

              {/* Subject Pills */}
              <div className="flex flex-wrap gap-2 mt-4">
                {subjects.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => setSelectedSubject(subject)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedSubject === subject
                        ? "gradient-hero text-primary-foreground shadow-soft"
                        : "bg-card border border-border hover:border-primary/30"
                    }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Feed Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            {/* Post Type Toggle */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex bg-muted rounded-xl p-1">
                <button
                  onClick={() => setPostType("all")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    postType === "all" ? "bg-card shadow-soft" : "text-muted-foreground"
                  }`}
                >
                  All Posts
                </button>
                <button
                  onClick={() => setPostType("teachers")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    postType === "teachers" ? "bg-card shadow-soft" : "text-muted-foreground"
                  }`}
                >
                  Teachers
                </button>
                <button
                  onClick={() => setPostType("students")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    postType === "students" ? "bg-card shadow-soft" : "text-muted-foreground"
                  }`}
                >
                  Students
                </button>
              </div>

              <Button variant="hero" className="gap-2">
                <Plus className="w-4 h-4" />
                Create Post
              </Button>
            </div>

            {/* Posts */}
            <div className="space-y-4">
              {mockTeacherPosts
                .filter((post) => 
                  postType === "all" || 
                  (postType === "teachers" && post.type === "teacher") ||
                  (postType === "students" && post.type === "student")
                )
                .map((post) => (
                <article 
                  key={post.id} 
                  className="bg-card rounded-2xl p-6 shadow-card hover:shadow-elevated transition-all duration-300"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl ${post.type === "teacher" ? "gradient-hero" : "bg-accent"} flex items-center justify-center text-lg font-semibold text-primary-foreground`}>
                        {post.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{post.name}</span>
                          {post.type === "teacher" && post.verified && (
                            <Badge variant="secondary" className="bg-success/10 text-success text-xs">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{post.subject}</span>
                          <span>•</span>
                          <span>{post.postedAt}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Badge variant="outline" className={post.type === "teacher" ? "border-primary text-primary" : "border-accent text-accent"}>
                      {post.type === "teacher" ? <GraduationCap className="w-3 h-3 mr-1" /> : <BookOpen className="w-3 h-3 mr-1" />}
                      {post.type === "teacher" ? "Teacher" : "Student Request"}
                    </Badge>
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
                  <p className="text-muted-foreground mb-4 leading-relaxed">{post.description}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map((tag) => (
                      <span key={tag} className="px-3 py-1 rounded-full bg-muted text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Meta Info */}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {post.location}
                    </span>
                    {post.type === "teacher" ? (
                      <>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          ${post.hourlyRate}/hr
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-warning text-warning" />
                          {post.rating} ({post.reviews} reviews)
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {post.availability}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          Budget: ${post.budget}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {post.schedule}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="gap-1.5">
                        <Heart className="w-4 h-4" />
                        Save
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-1.5">
                        <Share2 className="w-4 h-4" />
                        Share
                      </Button>
                    </div>
                    <Button variant={post.type === "teacher" ? "hero" : "secondary"} className="gap-2">
                      <MessageCircle className="w-4 h-4" />
                      {post.type === "teacher" ? "Contact Teacher" : "Respond"}
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Feed;
