'use client';
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { LEVEL_GROUPS, POPULAR_SUBJECTS, gradeMatches, splitGrade, subjectsFor } from "@/lib/classLevels";
import { SuggestInput } from "@/components/ui/suggest-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCreatePostModal } from "@/contexts/CreatePostModalContext";
import { useTeacherStatus } from "@/hooks/useTeacherStatus";
import { applyPostChange, onPostChanged } from "@/lib/postEvents";
import { formatMoney } from "@/lib/currency";
import { CLASS_TYPE_LABELS, slotDurationLabel, slotDateLabel, isPostExpired, PostDescription } from "@/components/post/postCardBits";
import BookClassModal, { type BookablePost } from "@/components/post/BookClassModal";
import PostActions from "@/components/post/PostActions";
import PostDetail, { type DetailPost } from "@/components/post/PostDetail";
import RespondDialog, { type RespondablePost } from "@/components/post/RespondDialog";
import { useMyResponses } from "@/hooks/useMyResponses";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  Check,
  Search,
  SlidersHorizontal,
  BookOpen,
  GraduationCap,
  Plus,
  LayoutGrid,
  LayoutList,
  Clock,
  CalendarDays,
  ChevronDown,
  X,
} from "lucide-react";

type PostItem = {
  id: string;
  likeCount?: number;
  commentCount?: number;
  likedByMe?: boolean;
  type: string;
  title: string;
  description: string;
  subject?: string;
  grade?: string;
  fee?: number;
  ratePerHour?: number;
  currency?: string;
  classTypes?: string[];
  maxStudents?: number;
  thumbnailUrl?: string;
  timeSlots?: { id: string; startTime: string; endTime: string; status?: string; bookedAs?: string | null; _count?: { bookings?: number } }[];
  mode?: "ONLINE";
  createdAt?: string;
  user?: { id: string; firstName: string; lastName: string };
};

const ALL_SUBJECTS = "All Subjects";
/** Chips shown before "More subjects". */
const SUBJECT_CHIP_LIMIT = 10;

const ExploreContent: React.FC = () => {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [bookPost, setBookPost] = useState<BookablePost | null>(null);
  const [respondPost, setRespondPost] = useState<RespondablePost | null>(null);
  const { hasResponded, markResponded } = useMyResponses();
  // The post whose full details are open; `id` alone is enough to load it.
  const [detailPost, setDetailPost] = useState<(Partial<DetailPost> & { id: string }) | null>(null);
  // Clicking a card opens its details, except on its own buttons and links.
  const openDetails = (post: PostItem) => (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, a, input, textarea, [role='dialog']")) return;
    setDetailPost(post);
  };

  const fetchPosts = useCallback(async () => {
    setIsLoadingPosts(true);
    try {
      const res = await fetch(`/api/posts`);
      if (res.ok) setPosts(await res.json());
    } catch (err) {
      console.error("Error fetching posts", err);
    } finally {
      setIsLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    // Reflect create/edit/delete instantly.
    return onPostChanged((c) => setPosts((prev) => applyPostChange(prev, c)));
  }, [fetchPosts]);

  // Old shared links (/explore?post=<id>) open that post's details.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = new URLSearchParams(window.location.search).get("post");
    if (id) setDetailPost({ id });
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState(ALL_SUBJECTS);
  const [postType, setPostType] = useState<"all" | "teachers" | "students">("all");
  const [grade, setGrade] = useState<string | null>(null);
  const [showAllSubjects, setShowAllSubjects] = useState(false);

  // Subject chips follow the picked level, so O/L shows O/L subjects.
  const levelSubjects = useMemo(() => {
    if (!grade) return POPULAR_SUBJECTS;
    const { level, stream } = splitGrade(grade);
    return subjectsFor(level, stream);
  }, [grade]);

  // A subject that isn't taught at the new level would hide every post.
  useEffect(() => {
    if (selectedSubject !== ALL_SUBJECTS && !levelSubjects.includes(selectedSubject)) setSelectedSubject(ALL_SUBJECTS);
  }, [levelSubjects, selectedSubject]);

  const subjectChips = useMemo(() => {
    if (showAllSubjects || levelSubjects.length <= SUBJECT_CHIP_LIMIT) return levelSubjects;
    const shown = levelSubjects.slice(0, SUBJECT_CHIP_LIMIT);
    // Keep the picked subject visible after collapsing.
    return shown.includes(selectedSubject) || selectedSubject === ALL_SUBJECTS ? shown : [...shown, selectedSubject];
  }, [levelSubjects, showAllSubjects, selectedSubject]);
  const hiddenSubjectCount = levelSubjects.length - SUBJECT_CHIP_LIMIT;

  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [classType, setClassType] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewType, setViewType] = useState<'grid' | 'compact'>('grid');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const router = useRouter();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { openCreatePost } = useCreatePostModal();
  // Teachers waiting on admin approval can browse but not post or respond yet.
  const { isTeacher: viewerIsTeacher, isApproved: teacherApproved } = useTeacherStatus();
  const teacherLocked = viewerIsTeacher && !teacherApproved;
  const lockedHint = "Available once your teacher profile is approved";
  const isGuest = !isAuthenticated;

  const activeFilterCount = [grade, minPrice, maxPrice, classType].filter((v) => v != null && v !== '').length;

  const resetFilters = () => {
    setGrade(null);
    setMinPrice(null);
    setMaxPrice(null);
    setClassType(null);
  };

  const filteredPosts = useMemo(() => {
    return posts
      .filter((post) => {
        // Every slot already finished — the offering is no longer bookable.
        if (isPostExpired(post.timeSlots)) return false;

        if (postType === "teachers" && post.type !== "TEACHER_OFFERING") return false;
        if (postType === "students" && post.type !== "STUDENT_REQUEST") return false;
        // Subjects are free text, so match loosely.
        if (selectedSubject !== ALL_SUBJECTS && post.subject?.trim().toLowerCase() !== selectedSubject.toLowerCase()) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const hay = `${post.title} ${post.description} ${post.subject || ""} ${post.user?.firstName || ""} ${post.user?.lastName || ""}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (grade && !gradeMatches(post.grade, grade)) return false;

        if (minPrice != null && (post.fee == null || post.fee < minPrice)) return false;
        if (maxPrice != null && (post.fee == null || post.fee > maxPrice)) return false;

        if (classType && !(post.classTypes || []).includes(classType)) return false;
        return true;
      })
      .sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      });
  }, [posts, searchQuery, selectedSubject, postType, grade, minPrice, maxPrice, classType]);

  return (
    <div className="pt-2">
      <div>
        <div className="container mx-auto px-4 pt-4">
          <section className="overflow-hidden rounded-3xl border border-border/70 bg-card/80 shadow-card backdrop-blur-xl">
            <div className="px-6 py-8 sm:px-8">
              <div className="mx-auto max-w-3xl text-center">
                <h1 className="text-3xl font-normal sm:text-4xl">
                  Explore <span className="font-serif italic text-gradient font-semibold">Classes</span>
                </h1>
                <p className="mt-2 text-muted-foreground">Browse teacher offerings or student requests. Find your perfect match.</p>
              </div>

              <div className="mx-auto mt-6 max-w-4xl">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by subject, topic, or teacher name..."
                      className="h-12 rounded-2xl pl-12 text-base"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button
                    variant={showFilters || activeFilterCount > 0 ? "default" : "outline"}
                    size="lg"
                    className="h-12 gap-2 rounded-2xl"
                    onClick={() => setShowFilters((s) => !s)}
                    aria-expanded={showFilters}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                    {activeFilterCount > 0 && (
                      <span className="rounded-full bg-primary-foreground/20 px-1.5 text-[11px] font-semibold">{activeFilterCount}</span>
                    )}
                  </Button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {[ALL_SUBJECTS, ...subjectChips].map((subject) => (
                    <button
                      key={subject}
                      onClick={() => setSelectedSubject(subject)}
                      aria-pressed={selectedSubject === subject}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${selectedSubject === subject
                        ? "gradient-hero text-primary-foreground shadow-soft"
                        : "border border-border/70 bg-background/60 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                        }`}
                    >
                      {subject}
                    </button>
                  ))}
                  {hiddenSubjectCount > 0 && (
                    <button
                      onClick={() => setShowAllSubjects((s) => !s)}
                      aria-expanded={showAllSubjects}
                      className="rounded-full px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                    >
                      {showAllSubjects ? "Fewer subjects" : `+${hiddenSubjectCount} more`}
                    </button>
                  )}
                </div>
                {grade && (
                  <p className="mt-2 text-xs text-muted-foreground">Showing subjects for {grade}. Change the level in Filters.</p>
                )}
              </div>
            </div>

            {showFilters && (
              <div className="border-t border-border/60 bg-background/40 px-6 py-6 sm:px-8">
                <div className="mx-auto max-w-4xl">
                  <div className="mb-4 flex items-center justify-between">
                    {activeFilterCount > 0 && (
                      <Button variant="ghost" size="sm" className="h-8 text-muted-foreground" onClick={resetFilters}>
                        <X className="mr-1 h-3.5 w-3.5" />
                        Clear all
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-1.5">
                      <label htmlFor="filter-grade" className="text-xs font-medium text-muted-foreground">Grade / Level</label>
                      <SuggestInput
                        id="filter-grade"
                        value={grade || ''}
                        onChange={(v) => setGrade(v || null)}
                        groups={LEVEL_GROUPS}
                        placeholder="Any level"
                        searchPlaceholder="Search levels…"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Price per class</label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          className="h-10 rounded-xl"
                          placeholder="Min"
                          aria-label="Minimum price"
                          value={minPrice ?? ''}
                          onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : null)}
                        />
                        <span className="text-muted-foreground">–</span>
                        <Input
                          type="number"
                          min={0}
                          className="h-10 rounded-xl"
                          placeholder="Max"
                          aria-label="Maximum price"
                          value={maxPrice ?? ''}
                          onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : null)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Class type</label>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(CLASS_TYPE_LABELS).map(([value, label]) => {
                          const active = classType === value;
                          return (
                            <button
                              key={value}
                              onClick={() => setClassType(active ? null : value)}
                              aria-pressed={active}
                              className={`rounded-full px-3 py-2 text-xs font-medium transition-colors ${active
                                ? "bg-primary text-primary-foreground"
                                : "border border-border/70 bg-background/60 text-muted-foreground hover:text-foreground"
                                }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto transition-all duration-300">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex rounded-full bg-muted p-1">
                {([['all', 'All Posts'], ['teachers', 'Teachers'], ['students', 'Students']] as const).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setPostType(id)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${postType === id ? 'bg-card shadow-soft' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex rounded-full bg-muted p-1">
                  <button onClick={() => setViewType('grid')} className={`rounded-full p-2 transition-all ${viewType === 'grid' ? 'bg-card shadow-soft text-primary' : 'text-muted-foreground'}`} title="Grid View"><LayoutGrid className="h-4 w-4" /></button>
                  <button onClick={() => setViewType('compact')} className={`rounded-full p-2 transition-all ${viewType === 'compact' ? 'bg-card shadow-soft text-primary' : 'text-muted-foreground'}`} title="Compact View"><LayoutList className="h-4 w-4" /></button>
                </div>
                <Button variant="hero" className="gap-2 rounded-full" disabled={teacherLocked} title={teacherLocked ? lockedHint : undefined} onClick={() => { if (isGuest) { toast({ title: 'Create an account', description: 'Please register or log in to create posts.' }); router.push('/auth'); return; } openCreatePost(); }}>
                  <Plus className="h-4 w-4" />
                  Create Post
                </Button>
              </div>
            </div>

            <div className={
              viewType === 'grid'
                ? "grid grid-cols-1 gap-6"
                : "space-y-4"
            }>
              {filteredPosts.map((post) => {
                const authorName = post.user ? `${post.user.firstName} ${post.user.lastName}` : 'Member';

                const duration = slotDurationLabel(post.timeSlots);
                const slotDate = slotDateLabel(post.timeSlots);
                const classTypeLabels = (post.classTypes || []).map((c) => CLASS_TYPE_LABELS[c] || c);
                const isTeacherPost = post.type === 'TEACHER_OFFERING';

                if (viewType === 'compact') {
                  const isExpanded = expandedId === post.id;
                  return (
                    <article
                      id={`post-${post.id}`}
                      key={post.id}
                      className={`overflow-hidden rounded-2xl border bg-card transition-all duration-300 ${isExpanded ? 'border-primary/40 shadow-elevated' : 'border-border/70 shadow-card hover:border-primary/30'}`}
                    >
                      {/* Row — the whole strip toggles the panel below */}
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : post.id)}
                        aria-expanded={isExpanded}
                        className="flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-muted/40"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gradient-hero text-sm font-semibold text-primary-foreground">
                            {authorName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold">{post.title}</h3>
                            <p className="truncate text-xs text-muted-foreground">{authorName} • {post.subject}</p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-3">
                          <div className="hidden items-center gap-3 text-xs text-muted-foreground sm:flex">
                            {duration && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{duration}</span>}
                            {slotDate && <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{slotDate}</span>}
                          </div>
                          {post.fee != null && (
                            <span className="text-sm font-bold text-primary">{formatMoney(post.fee, post.currency)}</span>
                          )}
                          <ChevronDown
                            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </div>
                      </button>

                      {isExpanded && (
                        <div onClick={openDetails(post)} className="cursor-pointer animate-in fade-in slide-in-from-top-2 border-t border-border/60 duration-300">
                          {post.thumbnailUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={post.thumbnailUrl} alt={post.title} className="h-44 w-full object-cover" />
                          )}
                          <div className="p-6">
                            <div className="mb-3 flex flex-wrap gap-2">
                              <Badge variant="outline" className="border-primary text-primary">
                                {isTeacherPost ? <GraduationCap className="mr-1 h-3 w-3" /> : <BookOpen className="mr-1 h-3 w-3" />}
                                {isTeacherPost ? 'Teacher' : 'Student'}
                              </Badge>
                              {post.subject && <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{post.subject}</span>}
                              {post.grade && <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{post.grade}</span>}
                              {classTypeLabels.map((c) => <span key={c} className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{c}</span>)}
                            </div>

                            <PostDescription text={post.description} />

                            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                              {post.fee != null && <span className="font-semibold text-foreground">{formatMoney(post.fee, post.currency)} <span className="font-normal text-muted-foreground">/ class</span></span>}
                              {duration && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{duration}</span>}
                              {slotDate && <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{slotDate}</span>}
                            </div>

                            <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                              <PostActions post={post} />
                              {isTeacherPost && (
                                user?.role?.toUpperCase() === 'STUDENT' && user.id !== post.user?.id ? (
                                  <Button size="sm" variant="hero" onClick={() => setBookPost(post as unknown as BookablePost)}>Book a class</Button>
                                ) : (
                                  <Button size="sm" variant="hero" onClick={() => router.push(`/teachers/${post.user?.id}`)}>Contact Teacher</Button>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                }

                return (
                  <article id={`post-${post.id}`} key={post.id} onClick={openDetails(post)} className="flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-card shadow-card transition-all duration-300 hover:shadow-elevated">
                    {/* Banner */}
                    {post.thumbnailUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.thumbnailUrl} alt={post.title} className="h-48 w-full object-cover" />
                    )}

                    <div className="flex flex-1 flex-col p-6">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-hero text-lg font-semibold text-primary-foreground">{authorName.split(' ').map(n => n[0]).slice(0, 2).join('')}</div>
                          <div>
                            <span className="font-semibold">{authorName}</span>
                            <p className="text-xs text-muted-foreground">{isTeacherPost ? 'Teacher' : 'Student'}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="shrink-0 border-primary text-primary">{isTeacherPost ? <GraduationCap className="mr-1 h-3 w-3" /> : <BookOpen className="mr-1 h-3 w-3" />}{isTeacherPost ? 'Teacher' : 'Student'}</Badge>
                      </div>

                      <h3 className="mb-2 text-lg font-semibold">
                        <button type="button" onClick={() => setDetailPost(post)} className="text-left hover:text-primary focus-visible:outline-none focus-visible:underline">
                          {post.title}
                        </button>
                      </h3>

                      {/* Subject / grade / class types */}
                      <div className="mb-3 flex flex-wrap gap-2">
                        {post.subject && <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{post.subject}</span>}
                        {post.grade && <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{post.grade}</span>}
                        {classTypeLabels.map((c) => <span key={c} className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{c}</span>)}
                      </div>

                      <PostDescription text={post.description} />

                      {/* Price, duration and date */}
                      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                        {post.fee != null && <span className="font-semibold text-foreground">{formatMoney(post.fee, post.currency)} <span className="font-normal text-muted-foreground">/ class</span></span>}
                        {duration && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{duration}</span>}
                        {slotDate && <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{slotDate}</span>}
                      </div>

                      <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                        <PostActions post={post} />
                        {(() => {
                          const userRole = user?.role?.toUpperCase();
                          const postType = post.type?.toUpperCase();
                          const isOwner = user && post.user && user.id === post.user.id;

                          if (isGuest) return (
                            <Button size="sm" variant={isTeacherPost ? 'hero' : 'secondary'} className="h-8 px-3 text-xs" onClick={() => { toast({ title: 'Register to interact', description: 'Please register to contact posts.' }); router.push('/auth'); }}>
                              {isTeacherPost ? 'Contact' : 'Respond'}
                            </Button>
                          );

                          if (isOwner) return <span className="text-[10px] uppercase font-bold text-muted-foreground">My Post</span>;

                          if (userRole === 'STUDENT' && postType === 'TEACHER_OFFERING') return (
                            <Button size="sm" variant="hero" className="h-8 px-3 text-xs" onClick={() => setBookPost(post as unknown as BookablePost)}>
                              Book a class
                            </Button>
                          );

                          if (userRole === 'TEACHER' && postType === 'STUDENT_REQUEST') return (
                            hasResponded(post.id) ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-success"><Check className="h-3.5 w-3.5" /> Responded</span>
                            ) : (
                              <Button size="sm" variant="hero" className="h-8 px-3 text-xs" disabled={teacherLocked} title={teacherLocked ? lockedHint : undefined} onClick={() => setRespondPost(post)}>
                                Respond
                              </Button>
                            )
                          );

                          return null;
                        })()}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <Dialog open={!!detailPost} onOpenChange={(o) => !o && setDetailPost(null)}>
        <DialogContent className="max-h-[92vh] max-w-4xl gap-0 overflow-y-auto p-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <DialogTitle className="sr-only">{detailPost?.title || "Post details"}</DialogTitle>
          <DialogDescription className="sr-only">Full details, times and comments for this post.</DialogDescription>
          {detailPost && (
            <PostDetail
              key={detailPost.id}
              postId={detailPost.id}
              initialPost={detailPost.type ? (detailPost as DetailPost) : null}
              onNavigate={() => setDetailPost(null)}
            />
          )}
        </DialogContent>
      </Dialog>
      <RespondDialog
        post={respondPost}
        open={!!respondPost}
        onOpenChange={(o) => !o && setRespondPost(null)}
        onSent={markResponded}
      />
      <BookClassModal
        post={bookPost}
        open={!!bookPost}
        onOpenChange={(o) => !o && setBookPost(null)}
        onBooked={fetchPosts}
      />
    </div>
  );
};

export default ExploreContent;
