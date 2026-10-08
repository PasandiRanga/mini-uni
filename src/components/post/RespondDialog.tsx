'use client';

import { useEffect, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { splitGrade } from "@/lib/classLevels";

const MAX_LENGTH = 2000;

export interface RespondablePost {
  id: string;
  title?: string;
  subject?: string;
  grade?: string | null;
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
  const [sending, setSending] = useState(false);
  const studentName = post?.user?.firstName || "the student";

  // A starter the teacher edits, so they aren't facing an empty box.
  useEffect(() => {
    if (!open || !post) return;
    // "A/L · Commerce" → "A/L": the stream would read oddly before the subject.
    const topic = [splitGrade(post.grade).level, post.subject].filter(Boolean).join(" ");
    setMessage(
      `Hi ${post.user?.firstName || "there"}, I can help you with ${topic || "this"}. ` +
        "Here's how I'd approach it: "
    );
  }, [open, post]);

  const send = async () => {
    if (!post || !message.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id, message: message.trim() }),
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
            Mention your experience, how you&apos;d teach it, and when you&apos;re free. {studentName} can then view your classes
            and book one.
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button variant="hero" className="gap-2" onClick={send} disabled={sending || !message.trim()}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send response
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RespondDialog;
