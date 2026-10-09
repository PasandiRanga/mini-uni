import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { StarInput } from "./StarRating";

export type Review = { rating: number; comment?: string | null };

interface RateClassDialogProps {
  bookingId: string | null;
  teacherName: string;
  classTitle: string;
  existing?: Review | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (bookingId: string, review: Review) => void;
}

const RateClassDialog: React.FC<RateClassDialogProps> = ({ bookingId, teacherName, classTitle, existing, onOpenChange, onSaved }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Start from the saved review when editing.
  useEffect(() => {
    if (!bookingId) return;
    setRating(existing?.rating ?? 0);
    setComment(existing?.comment ?? "");
  }, [bookingId, existing]);

  const save = async () => {
    if (!bookingId || !rating) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Couldn't save your review");
      onSaved(bookingId, data);
      toast({ title: existing ? "Review updated" : "Thanks for your review", description: `Your rating helps other students choose ${teacherName || "a teacher"}.` });
      onOpenChange(false);
    } catch (err) {
      toast({ title: "Couldn't save", description: err instanceof Error ? err.message : "Try again", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!bookingId} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit your review" : "Rate your class"}</DialogTitle>
          <DialogDescription>
            {classTitle}{teacherName ? ` with ${teacherName}` : ""}
          </DialogDescription>
        </DialogHeader>

        <StarInput value={rating} onChange={setRating} disabled={saving} />

        <div className="space-y-1.5">
          <label htmlFor="review-comment" className="text-sm font-medium">
            Tell other students about it <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <Textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
            rows={4}
            placeholder="How did the teacher explain things? Did the class help?"
            disabled={saving}
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button variant="hero" onClick={save} disabled={!rating || saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {existing ? "Save changes" : "Submit review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RateClassDialog;
