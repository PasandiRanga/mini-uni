'use client';

import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { formatMoney } from "@/lib/currency";
import { applyPostChange, emitPostChanged, onPostChanged } from "@/lib/postEvents";
import { FileText, RefreshCw, Pencil, Trash2, Plus } from "lucide-react";

interface TimeSlot {
  startTime: string;
  endTime: string;
}
interface MyPost {
  id: string;
  title?: string;
  subject?: string;
  description?: string;
  fee?: number;
  currency?: string;
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

  const renderPost = (p: MyPost, editable: boolean) => (
    <div key={p.id} className="flex items-start justify-between gap-4 rounded-2xl border border-border/70 bg-background/40 p-4 transition-colors hover:bg-muted/40">
      <div className="min-w-0">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <h3 className="font-medium">{p.title || p.subject || "Post"}</h3>
          {p.subject && <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/15">{p.subject}</Badge>}
          {p.isActive === false && <span className="text-xs text-muted-foreground">Inactive</span>}
        </div>
        {p.description && <p className="line-clamp-2 text-sm text-muted-foreground">{p.description}</p>}
        <div className="mt-2 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
          {p.fee != null && <span className="font-medium text-foreground">{formatMoney(p.fee, p.currency || user?.currency)}</span>}
          {p.timeSlots && <span>{p.timeSlots.length} slot{p.timeSlots.length === 1 ? "" : "s"}</span>}
          <span>{p.createdAt ? formatDistanceToNow(new Date(p.createdAt), { addSuffix: true }) : ""}</span>
        </div>
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
  );

  return (
    <section className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft">
      <div className="flex items-center justify-between border-b border-border/60 px-6 py-5">
        <h2 className="text-lg font-semibold">
          My <span className="font-serif font-normal">posts</span>
          {posts.length > 0 && <span className="ml-2 text-sm font-normal text-muted-foreground">({posts.length})</span>}
        </h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={fetchPosts} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button variant="hero" size="sm" onClick={() => openCreatePost()}>
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
            <p className="mb-4 text-sm text-muted-foreground">You haven&apos;t created any posts yet.</p>
            <Button variant="hero" onClick={() => openCreatePost()}>
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
