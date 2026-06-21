'use client';

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, RefreshCw, BookOpen } from "lucide-react";

interface RequestPost {
  id: string;
  title?: string;
  subject?: string;
  grade?: string | null;
  description?: string;
  createdAt: string;
  user?: { firstName?: string; lastName?: string };
}

const TeacherExplore = () => {
  const [posts, setPosts] = useState<RequestPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/posts?type=STUDENT_REQUEST");
      if (res.ok) setPosts(await res.json());
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <section className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft">
      <div className="flex items-center justify-between border-b border-border/60 px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold">
            Explore <span className="font-serif font-normal">requests</span>
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Students looking for a teacher.</p>
        </div>
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={fetchPosts} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      <div className="p-6">
        {loading && posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : posts.length === 0 ? (
          <div className="py-10 text-center">
            <Search className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">No student requests right now. Check back soon.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {posts.map((p) => {
              const student = `${p.user?.firstName || ""} ${p.user?.lastName || ""}`.trim() || "Student";
              return (
                <div key={p.id} className="flex flex-col rounded-2xl border border-border/70 bg-background/40 p-5 transition-colors hover:bg-muted/40">
                  <div className="mb-2 flex items-center gap-2">
                    {p.subject && <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/15">{p.subject}</Badge>}
                    {p.grade && <span className="text-xs text-muted-foreground">{p.grade}</span>}
                  </div>
                  <h3 className="font-medium">{p.title || p.subject || "Class request"}</h3>
                  {p.description && <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{p.description}</p>}
                  <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <BookOpen className="h-3.5 w-3.5" /> {student}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {p.createdAt ? formatDistanceToNow(new Date(p.createdAt), { addSuffix: true }) : ""}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default TeacherExplore;
