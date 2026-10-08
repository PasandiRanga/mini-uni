'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Inbox, Send, MessageSquare, RefreshCw, Check, X, Loader2, GraduationCap } from "lucide-react";

interface Inquiry {
  id: string;
  message?: string;
  status?: string;
  createdAt: string;
  sender?: { id?: string; firstName?: string; lastName?: string };
  receiver?: { id?: string; firstName?: string; lastName?: string };
  post?: { id?: string; title?: string; subject?: string; type?: string };
}

type Box = "received" | "sent";

const statusClasses = (status?: string) => {
  switch ((status || "").toUpperCase()) {
    case "ACCEPTED": return "bg-success/10 text-success";
    case "REJECTED":
    case "CANCELLED": return "bg-destructive/10 text-destructive";
    case "RESPONDED": return "bg-accent/10 text-accent";
    default: return "bg-warning/10 text-warning"; // PENDING
  }
};

/** Plain-language status, from the student's side. */
const statusLabel = (status: string, isReceived: boolean) => {
  switch (status) {
    case "ACCEPTED": return isReceived ? "Interested" : "Accepted";
    case "REJECTED": return "Declined";
    case "CANCELLED": return "Withdrawn";
    case "RESPONDED": return "Replied";
    default: return isReceived ? "New" : "Waiting";
  }
};

const personName = (p?: { firstName?: string; lastName?: string }, fallback = "Someone") =>
  `${p?.firstName || ""} ${p?.lastName || ""}`.trim() || fallback;

const initialsOf = (name: string) =>
  name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "?";

const StudentInquiries = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [box, setBox] = useState<Box>("received");
  const [sent, setSent] = useState<Inquiry[]>([]);
  const [received, setReceived] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/inquiries/student/${user.id}?box=all`);
      if (res.ok) {
        const data = await res.json();
        setSent(data.sent || []);
        setReceived(data.received || []);
      }
    } catch {
      /* ignore transient */
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (id: string, status: "ACCEPTED" | "REJECTED" | "CANCELLED") => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/inquiries/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Action failed");
      }
      toast({
        title:
          status === "ACCEPTED"
            ? "Great, they've been told you're interested"
            : status === "REJECTED"
              ? "Declined"
              : "Inquiry cancelled",
      });
      load();
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  // A response the teacher withdrew is no longer the student's to act on.
  const visibleReceived = received.filter(
    (i) => !(i.post?.type === "STUDENT_REQUEST" && (i.status || "").toUpperCase() === "CANCELLED")
  );
  const items = box === "received" ? visibleReceived : sent;

  return (
    <section className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-6 py-5">
        <div>
          <h2 className="text-lg font-normal">
            Your <span className="font-serif italic font-semibold">inquiries</span>
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Messages about classes — ones you&apos;ve received and ones you&apos;ve sent.
          </p>
        </div>
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Received / Sent toggle */}
      <div className="flex gap-2 px-6 pt-5">
        {([
          { id: "received", label: "Received", icon: Inbox, count: visibleReceived.length },
          { id: "sent", label: "Sent", icon: Send, count: sent.length },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setBox(t.id)}
            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              box === t.id
                ? "border-primary bg-primary/[0.08] text-primary"
                : "border-border/70 text-muted-foreground hover:bg-muted/60"
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
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center">
            <MessageSquare className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">
              {box === "received"
                ? "No inquiries received yet. When a teacher replies to one of your request posts, it'll show here."
                : "You haven't sent any inquiries yet. Ask a teacher about a class from the Explore tab."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((inq) => {
              const isReceived = box === "received";
              const person = isReceived ? inq.sender : inq.receiver;
              const name = personName(person, isReceived ? "Teacher" : "Teacher");
              const status = (inq.status || "PENDING").toUpperCase();
              // A teacher answering this student's "looking for a teacher" request.
              const isTeacherResponse = isReceived && inq.post?.type === "STUDENT_REQUEST";
              const teacherHref = inq.sender?.id ? `/teachers/${inq.sender.id}` : null;
              return (
                <div key={inq.id} className="flex items-start gap-4 rounded-2xl border border-border/70 bg-background/40 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full gradient-hero text-sm font-semibold text-primary-foreground">
                    {initialsOf(name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{isReceived ? name : `To ${name}`}</p>
                      {isTeacherResponse && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                          <GraduationCap className="h-3 w-3" /> Teacher
                        </span>
                      )}
                      <Badge className={`rounded-full ${statusClasses(status)}`}>{statusLabel(status, isReceived)}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isTeacherResponse ? "Responded to: " : ""}
                      {inq.post?.title || inq.post?.subject || "Class"}
                    </p>
                    {inq.message && (
                      <p className={`mt-1.5 text-sm text-muted-foreground ${isTeacherResponse ? "whitespace-pre-wrap break-words" : "line-clamp-2"}`}>
                        {inq.message}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {inq.createdAt ? formatDistanceToNow(new Date(inq.createdAt), { addSuffix: true }) : ""}
                    </p>

                    {/* Interested in a teacher's response → book one of their classes */}
                    {isTeacherResponse && status === "ACCEPTED" && teacherHref && (
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <p className="text-sm text-success">You&apos;re interested. Book one of {name}&apos;s classes to get started.</p>
                        <Button size="sm" variant="hero" asChild>
                          <Link href={teacherHref}>View classes</Link>
                        </Button>
                      </div>
                    )}

                    {/* Sent + accepted → nudge to book */}
                    {!isReceived && status === "ACCEPTED" && (
                      <p className="mt-2 text-sm text-success">Accepted — you can now book this class.</p>
                    )}

                    {/* Actions */}
                    {status === "PENDING" && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {isReceived ? (
                          <>
                            {isTeacherResponse && teacherHref && (
                              <Button size="sm" variant="outline" asChild>
                                <Link href={teacherHref}>View classes</Link>
                              </Button>
                            )}
                            <Button size="sm" onClick={() => setStatus(inq.id, "ACCEPTED")} disabled={busyId === inq.id} className="gap-1.5">
                              {busyId === inq.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                              {isTeacherResponse ? "I'm interested" : "Accept"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setStatus(inq.id, "REJECTED")} disabled={busyId === inq.id} className="gap-1.5 text-destructive">
                              <X className="h-4 w-4" /> {isTeacherResponse ? "Not interested" : "Decline"}
                            </Button>
                          </>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => setStatus(inq.id, "CANCELLED")} disabled={busyId === inq.id} className="gap-1.5 text-destructive">
                            {busyId === inq.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                            Cancel
                          </Button>
                        )}
                      </div>
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

export default StudentInquiries;
