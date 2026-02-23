import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Search,
  Filter,
  Star,
  DollarSign,
  BookOpen,
  GraduationCap,
  MessageCircle,
  Heart,
  Share2,
  ChevronDown,
  Plus,
  LayoutGrid,
  LayoutList
} from "lucide-react";

type PostItem = {
  id: string;
  type: string;
  title: string;
  description: string;
  subject?: string;
  grade?: string;
  fee?: number;
  availability?: string[];
  mode?: "ONLINE";
  rating?: number;
  createdAt?: string;
  user?: { id: string; firstName: string; lastName: string };
};

const subjects = [
  "All Subjects",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Spanish",
  "History",
  "Computer Science",
];

const ExploreContent: React.FC = () => {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoadingPosts(true);
      try {
        const res = await fetch(`/api/posts`);
        if (res.ok) {
          const data = await res.json();
          setPosts(data);
        }
      } catch (err) {
        console.error("Error fetching posts", err);
      } finally {
        setIsLoadingPosts(false);
      }
    };
    fetchPosts();
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All Subjects");
  const [postType, setPostType] = useState<"all" | "teachers" | "students">("all");
  const [grade, setGrade] = useState<string | null>(null);

  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  const [minRating, setMinRating] = useState<number | null>(null);
  const [availabilityFilter, setAvailabilityFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewType, setViewType] = useState<'grid' | 'compact'>('grid');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const router = useRouter();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const isGuest = !isAuthenticated;

  const filteredPosts = useMemo(() => {
    return posts
      .filter((post) => {
        if (postType === "teachers" && post.type !== "TEACHER_OFFERING") return false;
        if (postType === "students" && post.type !== "STUDENT_REQUEST") return false;
        if (selectedSubject && selectedSubject !== "All Subjects" && post.subject !== selectedSubject) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const hay = `${post.title} ${post.description} ${post.subject || ""} ${post.user?.firstName || ""} ${post.user?.lastName || ""}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (grade && post.grade && post.grade !== grade) return false;

        if (minPrice != null && (post.fee == null || post.fee < minPrice)) return false;
        if (maxPrice != null && (post.fee == null || post.fee > maxPrice)) return false;

        if (minRating != null && (post.rating == null || post.rating < minRating)) return false;
        if (availabilityFilter && post.availability) {
          if (!post.availability.includes(availabilityFilter)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const ra = a.rating || 0;
        const rb = b.rating || 0;
        if (rb !== ra) return rb - ra;
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      });
  }, [posts, searchQuery, selectedSubject, postType, grade, minPrice, maxPrice, minRating, availabilityFilter]);

  return (
    <div>
      <main className="pt-2">
        <div className="bg-muted/30 border-b border-border">
          <div className="container mx-auto px-4 py-6">
            <div className="max-w-3xl mx-auto text-center mb-4">
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                Explore <span className="font-serif italic text-gradient">Classes</span>
              </h1>
              <p className="text-muted-foreground">Browse teacher offerings or student requests. Find your perfect match.</p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input placeholder="Search by subject, topic, or teacher name..." className="pl-12 h-12 text-base" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <Button variant="outline" size="lg" className="gap-2" onClick={() => setShowFilters((s) => !s)}>
                  <Filter className="w-4 h-4" />
                  Filters
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {subjects.map((subject) => (
                  <button key={subject} onClick={() => setSelectedSubject(subject)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedSubject === subject ? "gradient-hero text-primary-foreground shadow-soft" : "bg-card border border-border hover:border-primary/30"}`}>
                    {subject}
                  </button>
                ))}
              </div>

              {showFilters && (
                <div className="mt-4 bg-card rounded-xl p-4 border border-border">
                  <div className="grid md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm font-medium">Grade / Level</label>
                      <Input placeholder="e.g. Grade 10, Undergraduate" value={grade || ''} onChange={(e) => setGrade(e.target.value || null)} />
                    </div>
                    <div />
                    <div />

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
                      <Button variant="outline" onClick={() => { setGrade(null); setMinPrice(null); setMaxPrice(null); setMinRating(null); setAvailabilityFilter(null); }}>Reset Filters</Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className={`${viewType === 'grid' ? 'max-w-6xl' : 'max-w-3xl'} mx-auto transition-all duration-300`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex bg-muted rounded-xl p-1">
                <button onClick={() => setPostType('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${postType === 'all' ? 'bg-card shadow-soft' : 'text-muted-foreground'}`}>All Posts</button>
                <button onClick={() => setPostType('teachers')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${postType === 'teachers' ? 'bg-card shadow-soft' : 'text-muted-foreground'}`}>Teachers</button>
                <button onClick={() => setPostType('students')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${postType === 'students' ? 'bg-card shadow-soft' : 'text-muted-foreground'}`}>Students</button>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex bg-muted rounded-xl p-1">
                  <button onClick={() => setViewType('grid')} className={`p-2 rounded-lg transition-all ${viewType === 'grid' ? 'bg-card shadow-soft text-primary' : 'text-muted-foreground'}`} title="Grid View"><LayoutGrid className="w-4 h-4" /></button>
                  <button onClick={() => setViewType('compact')} className={`p-2 rounded-lg transition-all ${viewType === 'compact' ? 'bg-card shadow-soft text-primary' : 'text-muted-foreground'}`} title="Compact View"><LayoutList className="w-4 h-4" /></button>
                </div>
                <Button variant="hero" className="gap-2" onClick={() => { if (isGuest) { toast({ title: 'Create an account', description: 'Please register or log in to create posts.' }); router.push('/auth'); return; } router.push('/post/create'); }}>
                  <Plus className="w-4 h-4" />
                  Create Post
                </Button>
              </div>
            </div>

            <div className={
              viewType === 'grid'
                ? "grid grid-cols-1 md:grid-cols-2 gap-6"
                : "space-y-4"
            }>
              {filteredPosts.map((post) => {
                const authorName = post.user ? `${post.user.firstName} ${post.user.lastName}` : 'Member';
                const subjectTag = post.subject ? [post.subject] : [];

                if (viewType === 'compact') {
                  const isExpanded = expandedId === post.id;
                  return (
                    <div key={post.id} className="space-y-2">
                      <article className={`bg-card rounded-xl p-4 shadow-sm border border-border/50 hover:border-primary/30 transition-all flex items-center justify-between gap-4 ${isExpanded ? 'border-primary/50 ring-1 ring-primary/5' : ''}`}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 shrink-0 rounded-lg gradient-hero flex items-center justify-center text-sm font-semibold text-primary-foreground`}>{authorName.split(' ').map(n => n[0]).slice(0, 2).join('')}</div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm truncate">{post.title}</h3>
                            <p className="text-xs text-muted-foreground truncate">{authorName} • {post.subject}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {post.fee && <span className="text-sm font-bold text-primary">${post.fee}</span>}
                          <Button
                            variant={isExpanded ? "secondary" : "ghost"}
                            size="sm"
                            className="h-8 px-3"
                            onClick={() => setExpandedId(isExpanded ? null : post.id)}
                          >
                            {isExpanded ? 'Close' : 'View'}
                          </Button>
                        </div>
                      </article>

                      {isExpanded && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                          <article className="bg-card rounded-2xl p-6 shadow-elevated border border-primary/20">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-xl gradient-hero flex items-center justify-center text-lg font-semibold text-primary-foreground`}>{authorName.split(' ').map(n => n[0]).slice(0, 2).join('')}</div>
                                <div>
                                  <div className="flex items-center gap-2"><span className="font-semibold">{authorName}</span></div>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground truncate"><span>{post.subject}</span></div>
                                </div>
                              </div>
                              <Badge variant="outline" className={'border-primary text-primary shrink-0'}>{post.type === 'TEACHER_OFFERING' ? <GraduationCap className="w-3 h-3 mr-1" /> : <BookOpen className="w-3 h-3 mr-1" />}{post.type === 'TEACHER_OFFERING' ? 'Teacher' : 'Student'}</Badge>
                            </div>
                            <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
                            <p className="text-muted-foreground mb-4 leading-relaxed text-sm">{post.description}</p>
                            <div className="flex flex-wrap gap-2 mb-4">{subjectTag.map((tag) => (<span key={tag} className="px-3 py-1 rounded-full bg-muted text-xs font-medium">{tag}</span>))}</div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                              <span className="flex items-center gap-1 font-semibold text-foreground"><DollarSign className="w-4 h-4 text-primary" />{post.fee}/hr</span>
                              <span>Online</span>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-border">
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Heart className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Share2 className="w-4 h-4" /></Button>
                              </div>
                              {post.type === 'TEACHER_OFFERING' && <Button size="sm" variant="hero" onClick={() => router.push(`/teachers/${post.user?.id}`)}>Contact Teacher</Button>}
                            </div>
                          </article>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <article key={post.id} className="bg-card rounded-2xl p-6 shadow-card hover:shadow-elevated transition-all duration-300 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl gradient-hero flex items-center justify-center text-lg font-semibold text-primary-foreground`}>{authorName.split(' ').map(n => n[0]).slice(0, 2).join('')}</div>
                        <div>
                          <div className="flex items-center gap-2"><span className="font-semibold">{authorName}</span></div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground truncate"><span>{post.subject}</span></div>
                        </div>
                      </div>

                      <Badge variant="outline" className={'border-primary text-primary shrink-0'}>{post.type === 'TEACHER_OFFERING' ? <GraduationCap className="w-3 h-3 mr-1" /> : <BookOpen className="w-3 h-3 mr-1" />}{post.type === 'TEACHER_OFFERING' ? 'Teacher' : 'Student'}</Badge>
                    </div>

                    <h3 className="text-lg font-semibold mb-2 line-clamp-1">{post.title}</h3>
                    <p className="text-muted-foreground mb-4 leading-relaxed line-clamp-2 text-sm">{post.description}</p>

                    <div className="flex flex-wrap gap-2 mb-4">{subjectTag.map((tag) => (<span key={tag} className="px-3 py-1 rounded-full bg-muted text-xs font-medium">{tag}</span>))}</div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4 mt-auto">
                      <span className="flex items-center gap-1">Online</span>
                      {post.fee && (<span className="flex items-center gap-1 font-semibold text-foreground"><DollarSign className="w-4 h-4 text-primary" />{post.fee}/hr</span>)}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { if (isGuest) { toast({ title: 'Sign in to save', description: 'Log in to save posts.' }); router.push('/auth'); return; } }}><Heart className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Share2 className="w-4 h-4" /></Button>
                      </div>
                      {(() => {
                        const userRole = user?.role?.toUpperCase();
                        const postType = post.type?.toUpperCase();
                        const isOwner = user && post.user && user.id === post.user.id;

                        if (isGuest) return (
                          <Button size="sm" variant={post.type === 'TEACHER_OFFERING' ? 'hero' : 'secondary'} className="h-8 px-3 text-xs" onClick={() => { toast({ title: 'Register to interact', description: 'Please register to contact posts.' }); router.push('/auth'); }}>
                            {post.type === 'TEACHER_OFFERING' ? 'Contact' : 'Respond'}
                          </Button>
                        );

                        if (isOwner) return <span className="text-[10px] uppercase font-bold text-muted-foreground">My Post</span>;

                        if (userRole === 'STUDENT' && postType === 'TEACHER_OFFERING') return (
                          <Button size="sm" variant="hero" className="h-8 px-3 text-xs" onClick={() => router.push(`/teachers/${post.user?.id}`)}>
                            Contact
                          </Button>
                        );

                        if (userRole === 'TEACHER' && postType === 'STUDENT_REQUEST') return (
                          <Button size="sm" variant="secondary" className="h-8 px-3 text-xs" onClick={() => toast({ title: 'Interest Sent', description: 'Interested.' })}>
                            Respond
                          </Button>
                        );

                        return null;
                      })()}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExploreContent;
