import { useEffect, useState, useMemo } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
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
import { Link } from "react-router-dom";

// Data fetched from backend (extend with commonly expected fields)
type PostItem = {
  id: string;
  type: string; // TEACHER_OFFERING | STUDENT_REQUEST
  title: string;
  description: string;
  subject?: string;
  grade?: string;
  location?: { city?: string; distanceKm?: number };
  fee?: number;
  availability?: string[]; // e.g. ['Mon AM', 'Tue PM']
  mode?: "ONLINE" | "PHYSICAL" | "BOTH";
  rating?: number;
  createdAt?: string;
  user?: { id: string; firstName: string; lastName: string };
};

const subjects = ["All Subjects", "Mathematics", "Physics", "Chemistry", "Biology", "English", "Spanish", "History", "Computer Science"];

const Feed = () => {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoadingPosts(true);
      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/posts`);
        if (res.ok) {
          const data = await res.json();
          setPosts(data);
        } else {
          console.warn('Failed to fetch posts');
        }
      } catch (err) {
        console.error('Error fetching posts', err);
      } finally {
        setIsLoadingPosts(false);
      }
    };

    fetchPosts();
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All Subjects");
  const [postType, setPostType] = useState<"all" | "teachers" | "students">("all");

  // Advanced filters
  const [grade, setGrade] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [mode, setMode] = useState<"ANY" | "ONLINE" | "PHYSICAL">("ANY");
  const [minRating, setMinRating] = useState<number | null>(null);
  const [availabilityFilter, setAvailabilityFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const isGuest = !isAuthenticated;

  // Compose filteredPosts using current filters
  const filteredPosts = useMemo(() => {
    return posts
      .filter((post) => {
        // Post type filter
        if (postType === "teachers" && post.type !== "TEACHER_OFFERING") return false;
        if (postType === "students" && post.type !== "STUDENT_REQUEST") return false;

        // Subject filter
        if (selectedSubject && selectedSubject !== "All Subjects" && post.subject !== selectedSubject) return false;

        // Search query filter
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const hay = `${post.title} ${post.description} ${post.subject || ""} ${post.user?.firstName || ""} ${post.user?.lastName || ""}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }

        // Grade
        if (grade && post.grade && post.grade !== grade) return false;

        // City / location
        if (city && post.location?.city) {
          if (!post.location.city.toLowerCase().includes(city.toLowerCase())) return false;
        }

        // Price range
        if (minPrice != null && (post.fee == null || post.fee < minPrice)) return false;
        if (maxPrice != null && (post.fee == null || post.fee > maxPrice)) return false;

        // Mode
        if (mode !== "ANY") {
          if (mode === "ONLINE" && post.mode === "PHYSICAL") return false;
          if (mode === "PHYSICAL" && post.mode === "ONLINE") return false;
        }

        // Rating
        if (minRating != null && (post.rating == null || post.rating < minRating)) return false;

        // Availability
        if (availabilityFilter && post.availability) {
          if (!post.availability.includes(availabilityFilter)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // simple sort by rating then recent
        const ra = a.rating || 0;
        const rb = b.rating || 0;
        if (rb !== ra) return rb - ra;
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      });
  }, [posts, searchQuery, selectedSubject, postType, grade, city, minPrice, maxPrice, mode, minRating, availabilityFilter]);

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
            {isGuest && (
              <div className="max-w-3xl mx-auto bg-yellow-50 border border-yellow-100 rounded-md p-3 text-sm text-yellow-900 mt-4">
                You are browsing as a guest. Create an account to save posts, contact teachers, or create your own posts. <Button variant="link" asChild><Link to="/signup">Get started</Link></Button>
              </div>
            )}

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
                {/* Location button removed — use 'City' in advanced filters instead */}
                <Button variant="outline" size="lg" className="gap-2" onClick={() => setShowFilters((s) => !s)}>
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
              {/* Advanced Filters Panel (toggle via Filters button) */}
              {showFilters && (
                <div className="mt-4 bg-card rounded-xl p-4 border border-border">
                <div className="grid md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium">Grade / Level</label>
                    <Input placeholder="e.g. Grade 10, Undergraduate" value={grade || ''} onChange={(e) => setGrade(e.target.value || null)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">City</label>
                    <Input placeholder="City or area" value={city || ''} onChange={(e) => setCity(e.target.value || null)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Mode</label>
                    <div className="flex gap-2 mt-1">
                      <button className={`px-3 py-1 rounded-lg ${mode === 'ANY' ? 'bg-card' : 'text-muted-foreground'}`} onClick={() => setMode('ANY')}>Any</button>
                      <button className={`px-3 py-1 rounded-lg ${mode === 'ONLINE' ? 'bg-card' : 'text-muted-foreground'}`} onClick={() => setMode('ONLINE')}>Online</button>
                      <button className={`px-3 py-1 rounded-lg ${mode === 'PHYSICAL' ? 'bg-card' : 'text-muted-foreground'}`} onClick={() => setMode('PHYSICAL')}>Physical</button>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="text-sm font-medium">Price min</label>
                    <Input type="number" placeholder="Min" value={minPrice ?? ''} onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : null)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Price max</label>
                    <Input type="number" placeholder="Max" value={maxPrice ?? ''} onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : null)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Min rating</label>
                    <Input type="number" placeholder="e.g. 4" value={minRating ?? ''} onChange={(e) => setMinRating(e.target.value ? Number(e.target.value) : null)} />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="text-sm font-medium">Availability (optional)</label>
                    <Input placeholder="e.g. Mon AM" value={availabilityFilter || ''} onChange={(e) => setAvailabilityFilter(e.target.value || null)} />
                  </div>
                  <div />
                  <div className="flex items-end justify-end">
                    <Button variant="outline" onClick={() => {
                      setGrade(null); setCity(null); setMinPrice(null); setMaxPrice(null); setMode('ANY'); setMinRating(null); setAvailabilityFilter(null);
                    }}>Reset Filters</Button>
                  </div>
                </div>
                </div>
              )}
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

              <Button variant="hero" className="gap-2" onClick={() => {
                if (isGuest) {
                  toast({ title: 'Create an account', description: 'Please register or log in to create posts.', variant: 'default' });
                  navigate('/auth');
                  return;
                }
                navigate('/post/create');
              }}>
                <Plus className="w-4 h-4" />
                Create Post
              </Button>
            </div>

              {/* Posts */}
            <div className="space-y-4">
              {filteredPosts.map((post) => {
                  const authorName = post.user ? `${post.user.firstName} ${post.user.lastName}` : 'Member';
                  const subjectTag = post.subject ? [post.subject] : [];
                  return (
                    <article key={post.id} className="bg-card rounded-2xl p-6 shadow-card hover:shadow-elevated transition-all duration-300">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl gradient-hero flex items-center justify-center text-lg font-semibold text-primary-foreground`}>
                            {authorName.split(' ').map(n => n[0]).slice(0,2).join('')}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{authorName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{post.subject}</span>
                              <span>•</span>
                              <span>{post.createdAt ? new Date(post.createdAt).toLocaleString() : ''}</span>
                            </div>
                          </div>
                        </div>

                        <Badge variant="outline" className={'border-primary text-primary'}>
                          {post.type === 'TEACHER_OFFERING' ? <GraduationCap className="w-3 h-3 mr-1" /> : <BookOpen className="w-3 h-3 mr-1" />}
                          {post.type === 'TEACHER_OFFERING' ? 'Teacher' : 'Student Request'}
                        </Badge>
                      </div>

                      <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
                      <p className="text-muted-foreground mb-4 leading-relaxed">{post.description}</p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {subjectTag.map((tag) => (
                          <span key={tag} className="px-3 py-1 rounded-full bg-muted text-sm">{tag}</span>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          Online
                        </span>
                        {post.fee && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            ${post.fee}/hr
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => {
                            if (isGuest) { toast({ title: 'Sign in to save', description: 'Log in to save posts to your account.'}); navigate('/auth'); return; }
                          }}>
                            <Heart className="w-4 h-4" />
                            Save
                          </Button>
                          <Button variant="ghost" size="sm" className="gap-1.5">
                            <Share2 className="w-4 h-4" />
                            Share
                          </Button>
                        </div>
                        <Button variant={post.type === 'TEACHER_OFFERING' ? 'hero' : 'secondary'} className="gap-2" onClick={() => {
                          if (isGuest) { toast({ title: 'Register to interact', description: 'Please register or log in to contact or respond to posts.'}); navigate('/auth'); return; }
                          // else: open messaging / inquiry flow
                        }}>
                          <MessageCircle className="w-4 h-4" />
                          {post.type === 'TEACHER_OFFERING' ? 'Contact Teacher' : 'Respond'}
                        </Button>
                      </div>
                    </article>
                  );
                })}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Feed;
