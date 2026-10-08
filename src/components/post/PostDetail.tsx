'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { BookOpen, CalendarDays, Check, Clock, GraduationCap, Loader2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCreatePostModal } from "@/contexts/CreatePostModalContext";
import { useToast } from "@/hooks/use-toast";
import { useTeacherStatus } from "@/hooks/useTeacherStatus";
import { formatMoney } from "@/lib/currency";
import { CLASS_TYPE_LABELS } from "@/components/post/postCardBits";
import PostActions, { CommentThread } from "@/components/post/PostActions";
import BookClassModal, { type BookablePost } from "@/components/post/BookClassModal";
import RespondDialog from "@/components/post/RespondDialog";
import { useMyResponses } from "@/hooks/useMyResponses";

interface DetailSlot {
  id: string;
  startTime: string;
  endTime: string;
  status?: string;
  bookedAs?: string | null;
  _count?: { bookings?: number };
}

export interface DetailPost {
  id: string;
  type: string;
  title: string;
  description: string;
  subject?: string;
  grade?: string | null;
  fee?: number | string | null;
  groupFee?: number | string | null;
  currency?: string;
  classTypes?: string[];
  maxStudents?: number | null;
  thumbnailUrl?: string | null;
  createdAt?: string;
  timeSlots?: DetailSlot[];
  likeCount?: number;
  commentCount?: number;
  likedByMe?: boolean;
  user?: { id: string; firstName: string; lastName: string; role?: string };
}

const durationLabel = (slot: DetailSlot) => {
  const min = Math.round((new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime()) / 60000);
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
};

/** "Booked" / "3 of 6 seats left" / "Open" for one time slot. */
const slotAvailability = (slot: DetailSlot, post: DetailPost) => {
  const taken = slot._count?.bookings ?? 0;
  if (slot.bookedAs === "INDIVIDUAL" || (slot.status === "BOOKED" && slot.bookedAs !== "GROUP")) {
    return { label: "Booked", open: false };
  }
  if (slot.bookedAs === "GROUP" && post.maxStudents) {
    const left = Math.max(post.maxStudents - taken, 0);
    return left > 0 ? { label: `${left} of ${post.maxStudents} seats left`, open: true } : { label: "Full", open: false };
  }
  return { label: "Open", open: true };
};

interface PostDetailProps {
  postId: string;
  /** Shown straight away while the full post loads. */
  initialPost?: DetailPost | null;
  /** Called before leaving the view (e.g. to close the dialog it sits in). */
  onNavigate?: () => void;
}

/**
 * Everything about one post: full image and description, prices, every
 * upcoming time slot with its seats, likes, comments and the main action.
 * Rendered inside the Explore dialog and on the shareable /post/<id> page.
 */
const PostDetail = ({ postId, initialPost, onNavigate }: PostDetailProps) => {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { openCreatePost } = useCreatePostModal();
  const teacherStatus = useTeacherStatus();
  const [post, setPost] = useState<DetailPost | null>(initialPost ?? null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [bookPost, setBookPost] = useState<BookablePost | null>(null);
  const [respondOpen, setRespondOpen] = useState(false);
  const { hasResponded, markResponded } = useMyResponses();
  const [commentCount, setCommentCount] = useState(initialPost?.commentCount ?? 0);
  const commentsRef = useRef<HTMLElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/posts/${postId}`);
      if (res.status === 404) {
        setMissing(true);
        return;
      }
      if (!res.ok) throw new Error();
      const data: DetailPost = await res.json();
      setPost(data);
      setCommentCount(data.commentCount ?? 0);
    } catch {
      toast({ title: "Couldn't load this post", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [postId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  if (missing) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="text-lg font-semibold">This post is no longer available</p>
        <p className="mt-1 text-sm text-muted-foreground">It may have been removed by its author.</p>
        <Button asChild variant="outline" className="mt-6" onClick={onNavigate}>
          <Link href="/explore">Back to Explore</Link>
        </Button>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex justify-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const isTeacherPost = post.type === "TEACHER_OFFERING";
  const authorName = post.user ? `${post.user.firstName} ${post.user.lastName}`.trim() : "Member";
  const initials = authorName.split(" ").map((n) => n[0]).slice(0, 2).join("");
  const isOwner = Boolean(user && post.user && user.id === post.user.id);
  const role = user?.role?.toUpperCase();
  const now = Date.now();
  const upcoming = (post.timeSlots || []).filter((s) => new Date(s.endTime).getTime() > now);
  const classTypes = post.classTypes || [];
  const offersGroup = classTypes.includes("GROUP");
  const groupPrice = post.groupFee != null ? post.groupFee : offersGroup && !classTypes.includes("INDIVIDUAL") ? post.fee : null;
  const individualPrice = classTypes.includes("INDIVIDUAL") || !offersGroup ? post.fee : null;

  const go = (href: string) => {
    onNavigate?.();
    router.push(href);
  };

  const primaryAction = (() => {
    if (!user) {
      return (
        <Button variant="hero" className="w-full" onClick={() => go("/auth")}>
          Sign in to {isTeacherPost ? "book" : "respond"}
        </Button>
      );
    }
    if (isOwner) {
      return (
        <Button variant="outline" className="w-full" onClick={() => { onNavigate?.(); openCreatePost(post.id, post); }}>
          Edit post
        </Button>
      );
    }
    if (role === "STUDENT" && isTeacherPost) {
      return (
        <Button variant="hero" className="w-full" disabled={upcoming.length === 0} onClick={() => setBookPost(post as unknown as BookablePost)}>
          {upcoming.length === 0 ? "No upcoming times" : "Book a class"}
        </Button>
      );
    }
    if (role === "TEACHER" && !isTeacherPost) {
      if (hasResponded(post.id)) {
        return (
          <p className="flex items-center justify-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-4 py-2 text-sm font-medium text-success">
            <Check className="h-4 w-4" /> You&apos;ve responded
          </p>
        );
      }
      const locked = !teacherStatus.isApproved;
      return (
        <Button
          variant="hero"
          className="w-full"
          disabled={locked}
          title={locked ? "Available once your profile is approved" : undefined}
          onClick={() => setRespondOpen(true)}
        >
          Respond to {post.user?.firstName || "student"}
        </Button>
      );
    }
    if (isTeacherPost && post.user) {
      return (
        <Button variant="outline" className="w-full" onClick={() => go(`/teachers/${post.user!.id}`)}>
          View teacher profile
        </Button>
      );
    }
    return null;
  })();

  return (
    <div>
      {post.thumbnailUrl && (
        <div className="flex max-h-[420px] justify-center overflow-hidden bg-muted/60">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.thumbnailUrl} alt={post.title} className="max-h-[420px] w-auto max-w-full object-contain" />
        </div>
      )}

      {/* Phones: details, then price/times/action, then comments. Wide screens:
          price/times/action stick in a right-hand column beside both. */}
      <div className={`grid gap-8 px-5 py-6 sm:px-8 ${isTeacherPost ? "lg:grid-cols-[minmax(0,1fr)_300px]" : ""}`}>
        <div className="min-w-0 space-y-6 lg:col-start-1">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl gradient-hero text-sm font-semibold text-primary-foreground">
                {initials}
              </div>
              <div className="min-w-0">
                {isTeacherPost && post.user ? (
                  <button type="button" onClick={() => go(`/teachers/${post.user!.id}`)} className="block truncate font-semibold hover:text-primary">
                    {authorName}
                  </button>
                ) : (
                  <p className="truncate font-semibold">{authorName}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {isTeacherPost ? "Teacher" : "Student"}
                  {post.createdAt && <> · {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</>}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="shrink-0 border-primary text-primary">
              {isTeacherPost ? <GraduationCap className="mr-1 h-3 w-3" /> : <BookOpen className="mr-1 h-3 w-3" />}
              {isTeacherPost ? "Class" : "Request"}
            </Badge>
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">{post.title}</h1>
            <div className="flex flex-wrap gap-2">
              {post.subject && <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{post.subject}</span>}
              {post.grade && <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{post.grade}</span>}
              {classTypes.map((c) => (
                <span key={c} className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{CLASS_TYPE_LABELS[c] || c}</span>
              ))}
            </div>
          </div>

          <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-foreground/85">{post.description}</p>

          <div className="border-t border-border/60 pt-3">
            <PostActions
              post={post}
              commentCountOverride={commentCount}
              onCommentsClick={() => commentsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            />
          </div>

        </div>

        {/* Price, times and the main action; sticks beside the content on wide screens. */}
        <aside className={`space-y-4 ${isTeacherPost ? "lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start" : "sm:max-w-xs"}`}>
          {isTeacherPost && (individualPrice != null || groupPrice != null) && (
            <div className="space-y-4 rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
              {individualPrice != null && (
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">One-to-one</p>
                  <p className="text-lg font-semibold">
                    {formatMoney(individualPrice, post.currency)}
                    <span className="text-xs font-normal text-muted-foreground"> / class</span>
                  </p>
                </div>
              )}
              {groupPrice != null && (
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Group{post.maxStudents ? ` · up to ${post.maxStudents} students` : ""}</p>
                  <p className="text-lg font-semibold">
                    {formatMoney(groupPrice, post.currency)}
                    <span className="text-xs font-normal text-muted-foreground"> / student</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {isTeacherPost && (
            <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <CalendarDays className="h-4 w-4 text-primary" /> Upcoming times
              </p>
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming times right now.</p>
              ) : (
                <ul className="space-y-2.5">
                  {upcoming.map((slot) => {
                    const avail = slotAvailability(slot, post);
                    return (
                      <li key={slot.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="min-w-0">
                          <span className="block truncate font-medium">
                            {new Date(slot.startTime).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" /> {durationLabel(slot)}
                          </span>
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            avail.open ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {slot.bookedAs === "GROUP" && <Users className="mr-1 inline h-3 w-3" />}
                          {avail.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {primaryAction}
          {loading && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Updating…
            </p>
          )}
        </aside>

        <div className="min-w-0 lg:col-start-1">
            <section ref={commentsRef} className="scroll-mt-4 space-y-4">
              <h2 className="text-base font-semibold">
                Comments{commentCount > 0 && <span className="ml-1.5 font-normal text-muted-foreground">{commentCount}</span>}
              </h2>
              <CommentThread
                post={post}
                onCountChange={setCommentCount}
                onRequireSignIn={() => go("/auth")}
                listClassName="max-h-none overflow-visible"
              />
            </section>
        </div>
      </div>

      <RespondDialog post={post} open={respondOpen} onOpenChange={setRespondOpen} onSent={markResponded} />
      <BookClassModal
        post={bookPost}
        open={!!bookPost}
        onOpenChange={(o) => !o && setBookPost(null)}
        onBooked={load}
      />
    </div>
  );
};

export default PostDetail;
