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
import { format } from "date-fns";

const MAX_LENGTH = 2000;

interface OfferSlot {
  id: string;
  startTime: string;
  endTime: string;
}

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
  const [slots, setSlots] = useState<OfferSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const studentName = post?.user?.firstName || "the student";
  const currency = post?.currency;
  const willingRate = post?.ratePerHour != null ? Number(post.ratePerHour) : null;

  const selectedSlot = slots.find((s) => s.id === selectedSlotId) || null;
  const durationMins = selectedSlot
    ? Math.round((new Date(selectedSlot.endTime).getTime() - new Date(selectedSlot.startTime).getTime()) / 60000)
    : 0;
  const total = Number(rate) > 0 && durationMins > 0 ? Math.round(Number(rate) * (durationMins / 60) * 100) / 100 : 0;

  // A starter the teacher edits, plus the student's available times to pick from.
  useEffect(() => {
    if (!open || !post) return;
    const topic = [splitGrade(post.grade).level, post.subject].filter(Boolean).join(" ");
    setMessage(
      `Hi ${post.user?.firstName || "there"}, I can help you with ${topic || "this"}. ` +
        "Here's how I'd approach it: "
    );
    setRate(post.ratePerHour != null ? String(Number(post.ratePerHour)) : "");
    setSelectedSlotId(null);
    setSlots([]);
    setLoadingSlots(true);
    fetch(`/api/posts/${post.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const now = Date.now();
        const future: OfferSlot[] = (data?.timeSlots || [])
          .filter((s: OfferSlot) => new Date(s.startTime).getTime() > now)
          .sort((a: OfferSlot, b: OfferSlot) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        setSlots(future);
      })
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [open, post]);

  const send = async () => {
    if (!post || !message.trim()) return;
    if (!(Number(rate) > 0)) {
      toast({ title: "Add your hourly rate", description: `${studentName} pays this rate for the chosen time.`, variant: "destructive" });
      return;
    }
    if (!selectedSlotId) {
      toast({ title: "Pick one of their times", variant: "destructive" });
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
          timeSlotId: selectedSlotId,
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

          <div className="space-y-3 rounded-xl border border-border/70 bg-muted/30 p-3">
            <div className="space-y-1.5">
              <Label htmlFor="rate" className="text-xs">Your rate / hour{willingRate ? ` (they're willing to pay ${formatMoney(willingRate, currency)})` : ""}</Label>
              <Input id="rate" type="number" min={0} inputMode="decimal" placeholder="e.g. 1500" value={rate} onChange={(e) => setRate(e.target.value)} className="max-w-[220px]" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Pick one of {studentName}&apos;s times</Label>
              {loadingSlots ? (
                <p className="text-sm text-muted-foreground">Loading their times…</p>
              ) : slots.length === 0 ? (
                <p className="text-sm text-muted-foreground">This student hasn&apos;t listed any available times.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {slots.map((s) => {
                    const start = new Date(s.startTime);
                    const mins = Math.round((new Date(s.endTime).getTime() - start.getTime()) / 60000);
                    const active = s.id === selectedSlotId;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedSlotId(s.id)}
                        className={`rounded-xl border p-2.5 text-left text-sm transition-colors ${active ? "border-primary bg-primary/[0.06]" : "border-border/70 hover:bg-muted/60"}`}
                      >
                        <span className="block font-medium">{format(start, "EEE, MMM d")}</span>
                        <span className="block text-xs text-muted-foreground">{format(start, "h:mm a")} · {mins < 60 ? `${mins} min` : `${mins / 60} hr`}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {total > 0 && (
              <p className="text-sm">
                {studentName} pays <span className="font-semibold">{formatMoney(total, currency)}</span>
                <span className="text-muted-foreground"> ({formatMoney(Number(rate), currency)}/hr × {durationMins / 60} hr)</span>
              </p>
            )}
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button variant="hero" className="gap-2" onClick={send} disabled={sending || !message.trim() || !(Number(rate) > 0) || !selectedSlotId}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send offer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RespondDialog;
