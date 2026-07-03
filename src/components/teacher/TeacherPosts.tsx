'use client';

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCreatePostModal } from "@/contexts/CreatePostModalContext";
import { formatMoney } from "@/lib/currency";
import { FileText, RefreshCw, Pencil, Trash2, Plus } from "lucide-react";

interface MyPost {
  id: string;
  title?: string;
  subject?: string;
  description?: string;
  fee?: number;
  currency?: string;
  isActive?: boolean;
  createdAt: string;
  timeSlots?: unknown[];
}

const TeacherPosts = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { openCreatePost } = useCreatePostModal();
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

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
    const onChanged = () => fetchPosts();
    window.addEventListener('miniuni:post-changed', onChanged);
    return () => window.removeEventListener('miniuni:post-changed', onChanged);
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setPosts((p) => p.filter((x) => x.id !== id));
      toast({ title: "Post deleted" });
    } catch (err: unknown) {
      toast({ title: "Couldn't delete", description: err instanceof Error ? err.message : "Try again", variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

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
          <div className="space-y-3">
            {posts.map((p) => (
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
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openCreatePost(p.id, p)} title="Edit">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(p.id)} disabled={deleting === p.id} title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default TeacherPosts;
