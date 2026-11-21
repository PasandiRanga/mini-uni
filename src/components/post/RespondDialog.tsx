'use client';

import { useEffect, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { splitGrade } from "@/lib/classLevels";
import { formatMoney } from "@/lib/currency";

const MAX_LENGTH = 2000;
const DURATIONS = [30, 45, 60, 90, 120];

export interface RespondablePost {
  id: string;
  title?: string;
  subject?: string;
  grade?: string | null;
  ratePerHour?: number | string | null; // the student's willing hourly rate
  currency?: string;
  user?: { firstName?: string; lastName?: string };
}

interface RespondDialogProps {
  post: RespondablePost | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called once the response is sent (or the server says one already exists). */
  onSent: (postId: string) => void;
}

/** A teacher's reply to a student's "looking for a teacher" request. */
const RespondDialog = ({ post, open, onOpenChange, onSent }: RespondDialogProps) => {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [rate, setRate] = useState("");
  const [start, setStart] = useState("");
  const [durationMins, setDurationMins] = useState(60);
  const [sending, setSending] = useState(false);
  const studentName = post?.user?.firstName || "the student";
  const currency = post?.currency;
  const willingRate = post?.ratePerHour != null ? Number(post.ratePerHour) : null;
  const total = Number(rate) > 0 ? Math.round(Number(rate) * (durationMins / 60) * 100) / 100 : 0;

  // A starter the teacher edits, so they aren't facing an empty box.
  useEffect(() => {
    if (!open || !post) return;
    // "A/L · Commerce" → "A/L": the stream would read oddly before the subject.
    const topic = [splitGrade(post.grade).level, post.subject].filter(Boolean).join(" ");
    setMessage(
      `Hi ${post.user?.firstName || "there"}, I can help you with ${topic || "this"}. ` +
        "Here's how I'd approach it: "
    );
    setRate(post.ratePerHour != null ? String(Number(post.ratePerHour)) : "");
    setStart("");
    setDurationMins(60);
  }, [open, post]);

  const send = async () => {
    if (!post || !message.trim()) return;
    if (!(Number(rate) > 0)) {
      toast({ title: "Add your hourly rate", description: "Students pay this rate for the duration you set.", variant: "destructive" });
      return;
    }
    if (!start || new Date(start).getTime() <= Date.now()) {
      toast({ title: "Pick a future date and time", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          message: message.trim(),
          proposedRate: Number(rate),
          proposedStartTime: new Date(start).toISOString(),
          proposedDurationMins: durationMins,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409 && data.code === "ALREADY_RESPONDED") {
        toast({ title: "Already sent", description: `You've already responded to ${studentName}.` });
        onSent(post.id);
        onOpenChange(false);
        return;
      }
      if (!res.ok) throw new Error(data.error || "Couldn't send your response");
      toast({ title: "Response sent", description: `${studentName} has been notified.` });
      onSent(post.id);
      onOpenChange(false);
    } catch (err: unknown) {
      toast({ title: "Couldn't send", description: err instanceof Error ? err.message : "Try again", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !sending && onOpenChange(o)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Respond to {studentName}</DialogTitle>
          <DialogDescription className="line-clamp-2">{post?.title}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MAX_LENGTH))}
            rows={6}
            autoFocus
            placeholder="Introduce yourself and how you'd help."
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Mention your experience and how you&apos;d teach it. Set your rate and a time below; {studentName} pays and books by accepting.
          </p>

          <div className="grid gap-3 rounded-xl border border-border/70 bg-muted/30 p-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="rate" className="text-xs">Your rate / hour{willingRate ? ` (they'll pay ${formatMoney(willingRate, currency)})` : ""}</Label>
              <Input id="rate" type="number" min={0} inputMode="decimal" placeholder="e.g. 1500" value={rate} onChange={(e) => setRate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="duration" className="text-xs">Duration</Label>
              <select
                id="duration"
                value={durationMins}
                onChange={(e) => setDurationMins(Number(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {DURATIONS.map((m) => (
                  <option key={m} value={m}>{m < 60 ? `${m} min` : `${m / 60} hr${m > 60 ? "s" : ""}`}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="start" className="text-xs">Class date and time</Label>
              <Input id="start" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            {total > 0 && (
              <p className="sm:col-span-2 text-sm">
                Total the student pays: <span className="font-semibold">{formatMoney(total, currency)}</span>
                <span className="text-muted-foreground"> ({formatMoney(Number(rate), currency)}/hr × {durationMins / 60} hr)</span>
              </p>
            )}
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button variant="hero" className="gap-2" onClick={send} disabled={sending || !message.trim() || !(Number(rate) > 0) || !start}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send offer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RespondDialog;
