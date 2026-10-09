'use client';
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { BadgeCheck, CalendarDays, Clock, GraduationCap, Mail } from "lucide-react";
import { InquiryDialog } from "@/components/teachers/InquiryDialog";
import { RatingBadge, Stars } from "@/components/reviews/StarRating";
import BookClassModal, { type BookablePost } from "@/components/post/BookClassModal";
import PostDetail, { type DetailPost } from "@/components/post/PostDetail";
import { CLASS_TYPE_LABELS, isPostExpired, slotDateLabel, slotDurationLabel } from "@/components/post/postCardBits";
import { formatMoney } from "@/lib/currency";
import { format } from "date-fns";

type PublicReview = { id: string; rating: number; comment: string | null; createdAt: string; author: string; subject: string | null };

type TeacherDetail = {
  id: string;
  firstName: string;
  lastName: string;
  subjects?: string[];
  rating?: number | null;
  reviewCount?: number;
  verified?: boolean;
  bio?: string;
  background?: string[];
};

interface TeacherProfileProps {
  id?: string;
}

const TeacherProfile: React.FC<TeacherProfileProps> = ({ id: propId }) => {
  const params = useParams();
  const id = propId || params?.id as string;
  const [teacher, setTeacher] = useState<TeacherDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [posts, setPosts] = useState<DetailPost[]>([]);
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [detailPost, setDetailPost] = useState<DetailPost | null>(null);
  const [bookPost, setBookPost] = useState<BookablePost | null>(null);
  const { user, isAuthenticated } = useAuth();
  const isGuest = !isAuthenticated;
  const canBook = user?.role === 'STUDENT' && user.id !== id;
  const { toast } = useToast();
  const router = useRouter();

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch(`/api/posts?teacherId=${id}&type=TEACHER_OFFERING`);
      if (res.ok) setPosts(await res.json());
    } catch (err) {
      console.error(err);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/teachers/${id}`);
        if (res.ok) setTeacher(await res.json());
        else if (res.status === 404) setNotFound(true);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchReviews = async () => {
      try {
        const res = await fetch(`/api/teachers/${id}/reviews`);
        if (res.ok) setReviews(await res.json());
      } catch (err) {
        console.error(err);
      }
    };

    fetchDetail();
    fetchPosts();
    fetchReviews();
  }, [id, fetchPosts]);

  // Only classes that still have a time to book.
  const openClasses = useMemo(() => posts.filter((p) => !isPostExpired(p.timeSlots)), [posts]);

  // Cheapest way to take a class with this teacher, across their open classes.
  const startingAt = useMemo(() => {
    let best: { amount: number; currency?: string } | null = null;
    for (const p of openClasses) {
      for (const fee of [p.fee, p.groupFee]) {
        const n = fee == null || fee === '' ? NaN : Number(fee);
        if (Number.isFinite(n) && (!best || n < best.amount)) best = { amount: n, currency: p.currency };
      }
    }
    return best;
  }, [openClasses]);

  const subjects = useMemo(() => {
    const fromProfile = teacher?.subjects?.filter(Boolean) || [];
    if (fromProfile.length) return fromProfile;
    return [...new Set(openClasses.map((p) => p.subject).filter((s): s is string => !!s))];
  }, [teacher, openClasses]);

  const requireSignIn = (what: string) => {
    toast({ title: `Sign in to ${what}`, description: 'Create a free student account or log in first.' });
    router.push('/auth');
  };

  const book = (post: DetailPost) => {
    if (isGuest) return requireSignIn('book');
    setBookPost(post as unknown as BookablePost);
  };

  // Header button: with one class, book it straight away; otherwise show the list.
  const handleBookClick = () => {
    if (isGuest) return requireSignIn('book');
    if (openClasses.length === 1) return book(openClasses[0]);
    document.getElementById('classes')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (notFound) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Teacher not found</h1>
        <p className="mt-2 text-muted-foreground">This teacher isn&apos;t available right now.</p>
        <Button className="mt-6" variant="hero" onClick={() => router.push('/teachers')}>Browse teachers</Button>
      </main>
      <Footer />
    </div>
  );

  if (!teacher) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 text-muted-foreground">Loading…</main>
      <Footer />
    </div>
  );

  const fullName = `${teacher.firstName} ${teacher.lastName}`;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Header */}
          <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-card sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl gradient-hero text-2xl font-semibold text-primary-foreground sm:h-24 sm:w-24">
                {teacher.firstName.charAt(0)}{teacher.lastName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold">{fullName}</h1>
                  {teacher.verified && (
                    <Badge variant="secondary" className="gap-1"><BadgeCheck className="h-3.5 w-3.5" /> Verified</Badge>
                  )}
                </div>
                {subjects.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {subjects.map((s) => (
                      <span key={s} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{s}</span>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                  <RatingBadge rating={teacher.rating} count={teacher.reviewCount} />
                  {startingAt && (
                    <span className="text-muted-foreground">
                      From <span className="font-semibold text-foreground">{formatMoney(startingAt.amount, startingAt.currency)}</span> / class
                    </span>
                  )}
                </div>
                {teacher.bio && <p className="mt-4 whitespace-pre-line text-sm text-muted-foreground">{teacher.bio}</p>}

                <div className="mt-5 flex flex-wrap gap-3">
                  {user?.role === 'TEACHER' || user?.role === 'ADMIN' ? (
                    <p className="text-sm italic text-muted-foreground">Students can book and message teachers from here.</p>
                  ) : (
                    <>
                      <Button variant="hero" onClick={handleBookClick} disabled={openClasses.length === 0} title={openClasses.length === 0 ? 'No classes open right now' : undefined}>
                        <CalendarDays className="mr-2 h-4 w-4" /> Book a class
                      </Button>
                      <Button variant="outline" onClick={() => (isGuest ? requireSignIn('message') : setIsInquiryOpen(true))} disabled={openClasses.length === 0}>
                        <Mail className="mr-2 h-4 w-4" /> Message
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Background */}
          {(teacher.background?.length ?? 0) > 0 && (
            <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-card">
              <h2 className="text-lg font-semibold">Background</h2>
              <ul className="mt-3 space-y-2">
                {teacher.background!.map((line) => (
                  <li key={line} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {line}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Classes */}
          <section id="classes" className="scroll-mt-24 rounded-3xl border border-border/70 bg-card p-6 shadow-card">
            <h2 className="text-lg font-semibold">Classes <span className="font-normal text-muted-foreground">({openClasses.length})</span></h2>
            <div className="mt-4 space-y-3">
              {openClasses.map((p) => {
                const duration = slotDurationLabel(p.timeSlots);
                const date = slotDateLabel(p.timeSlots);
                return (
                  <div
                    key={p.id}
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { if (!(e.target as HTMLElement).closest('button')) setDetailPost(p); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') setDetailPost(p); }}
                    className="flex cursor-pointer flex-col gap-3 rounded-2xl border border-border/70 bg-background/40 p-4 transition-colors hover:border-primary/30 hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{p.title}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {p.subject && <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{p.subject}</span>}
                        {p.grade && <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">{p.grade}</span>}
                        {(p.classTypes || []).map((c) => <span key={c} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">{CLASS_TYPE_LABELS[c] || c}</span>)}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {p.fee != null && <span className="font-semibold text-foreground">{formatMoney(Number(p.fee), p.currency)} / class</span>}
                        {duration && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{duration}</span>}
                        {date && <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{date}</span>}
                      </div>
                    </div>
                    {(canBook || isGuest) && (
                      <Button size="sm" variant="hero" className="shrink-0" onClick={() => book(p)}>Book</Button>
                    )}
                  </div>
                );
              })}
              {openClasses.length === 0 && <p className="text-sm text-muted-foreground">No classes open right now. Check back soon.</p>}
            </div>
          </section>

          {/* Reviews */}
          <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-card">
            <h2 className="text-lg font-semibold">Reviews <span className="font-normal text-muted-foreground">({teacher.reviewCount ?? reviews.length})</span></h2>
            <div className="mt-4 space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-2xl bg-muted/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Stars value={r.rating} className="h-3.5 w-3.5" />
                      <span className="text-sm font-medium">{r.author}</span>
                      {r.subject && <span className="text-xs text-muted-foreground">· {r.subject}</span>}
                    </div>
                    <span className="text-xs text-muted-foreground">{format(new Date(r.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                  {r.comment && <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{r.comment}</p>}
                </div>
              ))}
              {reviews.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet.</p>}
            </div>
          </section>
        </div>
      </main>
      <Footer />

      <Dialog open={!!detailPost} onOpenChange={(o) => !o && setDetailPost(null)}>
        <DialogContent className="max-h-[92vh] max-w-4xl gap-0 overflow-y-auto p-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <DialogTitle className="sr-only">{detailPost?.title || "Class details"}</DialogTitle>
          <DialogDescription className="sr-only">Full details and times for this class.</DialogDescription>
          {detailPost && (
            <PostDetail
              key={detailPost.id}
              postId={detailPost.id}
              initialPost={detailPost}
              onNavigate={() => setDetailPost(null)}
            />
          )}
        </DialogContent>
      </Dialog>
      <BookClassModal
        post={bookPost}
        open={!!bookPost}
        onOpenChange={(o) => !o && setBookPost(null)}
        onBooked={fetchPosts}
      />
      <InquiryDialog
        isOpen={isInquiryOpen}
        onClose={() => setIsInquiryOpen(false)}
        teacherId={teacher.id}
        teacherName={fullName}
        posts={openClasses}
      />
    </div>
  );
};

export default TeacherProfile;
