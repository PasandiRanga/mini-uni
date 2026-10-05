'use client';

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare, RefreshCw } from "lucide-react";

interface Inquiry {
  id: string;
  message?: string;
  status?: string;
  createdAt: string;
  sender?: { firstName?: string; lastName?: string };
  post?: { id?: string; title?: string; subject?: string };
}

const statusClasses = (status?: string) => {
  switch ((status || "").toUpperCase()) {
    case "ACCEPTED": return "bg-success/10 text-success";
    case "REJECTED": case "CANCELLED": return "bg-destructive/10 text-destructive";
    case "RESPONDED": return "bg-accent/10 text-accent";
    default: return "bg-warning/10 text-warning"; // PENDING
  }
};

const TeacherInquiries = () => {
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInquiries = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/inquiries/teacher/${user.id}`);
      if (res.ok) setInquiries(await res.json());
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <section className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft">
      <div className="flex items-center justify-between border-b border-border/60 px-6 py-5">
        <div>
          <h2 className="text-lg font-normal">
            Your <span className="font-serif font-semibold">inquiries</span>
            {inquiries.length > 0 && <span className="ml-2 text-sm font-normal text-muted-foreground">({inquiries.length})</span>}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Students asking about your classes.</p>
        </div>
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={fetchInquiries} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      <div className="p-6">
        {loading && inquiries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : inquiries.length === 0 ? (
          <div className="py-10 text-center">
            <MessageSquare className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">No inquiries yet. When students reply to your posts, they&apos;ll show up here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {inquiries.map((inq) => {
              const sender = `${inq.sender?.firstName || ""} ${inq.sender?.lastName || ""}`.trim() || "Student";
              const initials = (sender || "S").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
              return (
                <div key={inq.id} className="flex items-start gap-4 rounded-2xl border border-border/70 bg-background/40 p-4 transition-colors hover:bg-muted/40">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full gradient-hero text-sm font-semibold text-primary-foreground">
                    {initials || "S"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{sender}</p>
                      <Badge className={`rounded-full ${statusClasses(inq.status)}`}>{inq.status || "PENDING"}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{inq.post?.title || inq.post?.subject || "Class"}</p>
                    {inq.message && <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{inq.message}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {inq.createdAt ? formatDistanceToNow(new Date(inq.createdAt), { addSuffix: true }) : ""}
                    </p>
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

export default TeacherInquiries;
