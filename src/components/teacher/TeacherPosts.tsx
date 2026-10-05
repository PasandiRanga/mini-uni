'use client';

import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCreatePostModal } from "@/contexts/CreatePostModalContext";
import { useTeacherStatus } from "@/hooks/useTeacherStatus";
import { formatMoney } from "@/lib/currency";
import { applyPostChange, emitPostChanged, onPostChanged } from "@/lib/postEvents";
import { CLASS_TYPE_LABELS, slotDurationLabel, slotDateLabel, PostDescription } from "@/components/post/postCardBits";
import { FileText, RefreshCw, Pencil, Trash2, Plus, Clock, CalendarDays } from "lucide-react";

interface TimeSlot {
  startTime: string;
  endTime: string;
}
interface MyPost {
  id: string;
  title?: string;
  subject?: string;
  grade?: string;
  description?: string;
  fee?: number;
  currency?: string;
  classTypes?: string[];
  thumbnailUrl?: string;
  isActive?: boolean;
  createdAt: string;
  timeSlots?: TimeSlot[];
}

// A post is "past" once it has time slots and its last slot has ended.
const latestEnd = (p: MyPost) => (p.timeSlots ?? []).reduce((m, s) => Math.max(m, new Date(s.endTime).getTime()), 0);
const isPastPost = (p: MyPost) => (p.timeSlots?.length ?? 0) > 0 && latestEnd(p) < Date.now();

const TeacherPosts = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { openCreatePost } = useCreatePostModal();
  // Posting opens up once an admin approves the teacher's profile.
  const { isApproved, loading: statusLoading } = useTeacherStatus();
  const lockedHint = "Available once your profile is approved";
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmPost, setConfirmPost] = useState<MyPost | null>(null);
  const [view, setView] = useState<'active' | 'past'>('active');

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/posts/mine");
      if (res.ok) setPosts(await res.json());
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    // Apply create/edit/delete instantly instead of refetching.
    return onPostChanged((c) => setPosts((prev) => applyPostChange(prev, c)));
  }, []);

  const { upcoming, past } = useMemo(() => {
    const up: MyPost[] = [];
    const pa: MyPost[] = [];
    posts.forEach((p) => (isPastPost(p) ? pa : up).push(p));
    return { upcoming: up, past: pa };
  }, [posts]);

  const handleDelete = async (id: string) => {
    const prev = posts;
    // Optimistic: remove immediately and close the dialog.
    setPosts((p) => p.filter((x) => x.id !== id));
    setConfirmPost(null);
    setDeleting(id);
    try {
      const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      emitPostChanged({ action: "deleted", id });
      toast({ title: "Post deleted" });
    } catch (err: unknown) {
      setPosts(prev); // rollback on failure
      toast({ title: "Couldn't delete", description: err instanceof Error ? err.message : "Try again", variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  const renderPost = (p: MyPost, editable: boolean) => {
    const duration = slotDurationLabel(p.timeSlots);
    const slotDate = slotDateLabel(p.timeSlots);
    const classTypeLabels = (p.classTypes || []).map((c) => CLASS_TYPE_LABELS[c] || c);
    return (
      <article key={p.id} className="overflow-hidden rounded-2xl border border-border/70 bg-background/40 transition-colors hover:bg-muted/40">
        {/* Banner */}
        {p.thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.thumbnailUrl} alt={p.title || "thumbnail"} className="h-40 w-full object-cover" />
        )}

        <div className="flex items-start justify-between gap-4 p-5">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h3 className="font-medium">{p.title || p.subject || "Post"}</h3>
              {p.isActive === false && <span className="text-xs text-muted-foreground">Inactive</span>}
            </div>

            <div className="mb-3 flex flex-wrap gap-2">
              {p.subject && <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{p.subject}</span>}
              {p.grade && <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{p.grade}</span>}
              {classTypeLabels.map((c) => <span key={c} className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{c}</span>)}
            </div>

            {p.description && <PostDescription text={p.description} />}

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
              {p.fee != null && <span className="font-semibold text-foreground">{formatMoney(p.fee, p.currency || user?.currency)} <span className="font-normal text-muted-foreground">/ class</span></span>}
              {duration && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{duration}</span>}
              {slotDate && <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{slotDate}</span>}
            </div>

            <p className="mt-2 text-xs text-muted-foreground">{p.createdAt ? formatDistanceToNow(new Date(p.createdAt), { addSuffix: true }) : ""}</p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {editable && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openCreatePost(p.id, p)} title="Edit">
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setConfirmPost(p)} disabled={deleting === p.id} title="Delete">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </article>
    );
  };

  return (
    <section className="mx-auto w-full max-w-3xl overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft">
      <div className="flex items-center justify-between border-b border-border/60 px-6 py-5">
        <h2 className="text-lg font-normal">
          My <span className="font-serif font-semibold">posts</span>
          {posts.length > 0 && <span className="ml-2 text-sm font-normal text-muted-foreground">({posts.length})</span>}
        </h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={fetchPosts} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button variant="hero" size="sm" onClick={() => openCreatePost()} disabled={!isApproved} title={isApproved ? undefined : lockedHint}>
            <Plus className="h-4 w-4" /> New
          </Button>
        </div>
      </div>

      <div className="p-6">
        {loading && posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : posts.length === 0 ? (
          <div className="py-10 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" strokeWidth={1.5} />
            <p className="mb-4 text-sm text-muted-foreground">
              {isApproved || statusLoading
                ? "You haven't created any posts yet."
                : "You can create posts once an admin approves your teacher profile."}
            </p>
            <Button variant="hero" onClick={() => openCreatePost()} disabled={!isApproved} title={isApproved ? undefined : lockedHint}>
              <Plus className="h-4 w-4" /> Create your first post
            </Button>
          </div>
        ) : (
          <>
            {/* Active / Past toggle */}
            <div className="mb-5 inline-flex rounded-xl bg-muted p-1">
              <button
                type="button"
                onClick={() => setView('active')}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${view === 'active' ? 'bg-card shadow-soft' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Active <span className="font-normal">({upcoming.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setView('past')}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${view === 'past' ? 'bg-card shadow-soft' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Past <span className="font-normal">({past.length})</span>
              </button>
            </div>

            {view === 'past' && past.length > 0 && (
              <p className="mb-3 text-xs text-muted-foreground">These classes have already taken place and can no longer be edited.</p>
            )}

            {(view === 'active' ? upcoming : past).length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {view === 'active' ? 'No active posts.' : 'No past posts.'}
              </p>
            ) : (
              <div className={`space-y-3 ${view === 'past' ? 'opacity-80' : ''}`}>
                {(view === 'active' ? upcoming : past).map((p) => renderPost(p, view === 'active'))}
              </div>
            )}
          </>
        )}
      </div>

      <AlertDialog open={!!confirmPost} onOpenChange={(o) => { if (!o) setConfirmPost(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{confirmPost?.title || confirmPost?.subject || "This post"}&rdquo; will be permanently deleted. This can&apos;t be undone, and students will no longer be able to see it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); if (confirmPost) handleDelete(confirmPost.id); }}
              disabled={!!deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

export default TeacherPosts;
