'use client';

import { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Inbox, Loader2, MessageSquare, RefreshCw, Send, X } from "lucide-react";

interface Inquiry {
  id: string;
  message?: string;
  status?: string;
  createdAt: string;
  sender?: { firstName?: string; lastName?: string };
  receiver?: { firstName?: string; lastName?: string };
  post?: { id?: string; title?: string; subject?: string };
}

type Box = "received" | "sent";

const statusClasses = (status?: string) => {
  switch ((status || "").toUpperCase()) {
    case "ACCEPTED": return "bg-success/10 text-success";
    case "REJECTED": case "CANCELLED": return "bg-destructive/10 text-destructive";
    case "RESPONDED": return "bg-accent/10 text-accent";
    default: return "bg-warning/10 text-warning"; // PENDING
  }
};

/** Plain-language status, from the teacher's side. */
const statusLabel = (status: string, box: Box) => {
  switch (status) {
    case "ACCEPTED": return box === "sent" ? "Student interested" : "Accepted";
    case "REJECTED": return "Declined";
    case "CANCELLED": return "Withdrawn";
    case "RESPONDED": return "Replied";
    default: return box === "sent" ? "Awaiting reply" : "New";
  }
};

const nameOf = (p?: { firstName?: string; lastName?: string }) =>
  `${p?.firstName || ""} ${p?.lastName || ""}`.trim() || "Student";

const TeacherInquiries = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [box, setBox] = useState<Box>("received");
  const [received, setReceived] = useState<Inquiry[]>([]);
  const [sent, setSent] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchInquiries = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [r, s] = await Promise.all([
        fetch(`/api/inquiries/teacher/${user.id}`),
        fetch(`/api/inquiries/teacher/${user.id}?box=sent`),
      ]);
      if (r.ok) setReceived(await r.json());
      if (s.ok) setSent(await s.json());
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const withdraw = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/inquiries/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Couldn't withdraw");
      toast({ title: "Response withdrawn" });
      fetchInquiries();
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Try again", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const items = box === "received" ? received : sent;

  return (
    <section className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft">
      <div className="flex items-center justify-between border-b border-border/60 px-6 py-5">
        <div>
          <h2 className="text-lg font-normal">
            Your <span className="font-serif font-semibold">inquiries</span>
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Questions about your classes, and your responses to students&apos; requests.
          </p>
        </div>
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={fetchInquiries} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      <div className="flex gap-2 px-6 pt-5">
        {([
          { id: "received", label: "Received", icon: Inbox, count: received.length },
          { id: "sent", label: "My responses", icon: Send, count: sent.length },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setBox(t.id)}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              box === t.id ? "border-primary bg-primary/[0.08] text-primary" : "border-border/70 text-muted-foreground hover:bg-muted/60"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            {t.count > 0 && <span className="text-xs text-muted-foreground">({t.count})</span>}
          </button>
        ))}
      </div>

      <div className="p-6">
        {loading && items.length === 0 ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center">
            <MessageSquare className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">
              {box === "received"
                ? "No inquiries yet. When students ask about your classes, they'll show up here."
                : "You haven't responded to any requests yet. Find students looking for a teacher in Explore → Students."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((inq) => {
              const person = nameOf(box === "received" ? inq.sender : inq.receiver);
              const initials = person.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "S";
              const status = (inq.status || "PENDING").toUpperCase();
              return (
                <div key={inq.id} className="flex items-start gap-4 rounded-2xl border border-border/70 bg-background/40 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full gradient-hero text-sm font-semibold text-primary-foreground">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{box === "sent" ? `To ${person}` : person}</p>
                      <Badge className={`rounded-full ${statusClasses(status)}`}>{statusLabel(status, box)}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {box === "sent" ? "Request: " : ""}
                      {inq.post?.title || inq.post?.subject || "Class"}
                    </p>
                    {inq.message && <p className="mt-1.5 line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">{inq.message}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {inq.createdAt ? formatDistanceToNow(new Date(inq.createdAt), { addSuffix: true }) : ""}
                    </p>

                    {box === "sent" && status === "ACCEPTED" && (
                      <p className="mt-2 text-sm text-success">
                        {person} is interested. Make sure you have a class with open times. They&apos;ll book it from your profile.
                      </p>
                    )}
                    {box === "sent" && status === "PENDING" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3 gap-1.5 text-destructive"
                        onClick={() => withdraw(inq.id)}
                        disabled={busyId === inq.id}
                      >
                        {busyId === inq.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                        Withdraw
                      </Button>
                    )}
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
