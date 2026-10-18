import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { DISPUTE_REASONS, DISPUTE_WINDOW_HOURS, type DisputeReason } from "@/lib/disputeReasons";

export type BookingDispute = {
  reason: string;
  details: string;
  status: string; // OPEN | REFUNDED | RELEASED
  teacherResponse?: string | null;
  resolutionNote?: string | null;
  createdAt?: string;
};

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : "Try again");

/** Student: report a problem with a class. */
export const ReportProblemDialog: React.FC<{
  bookingId: string | null;
  classTitle: string;
  onOpenChange: (open: boolean) => void;
  onReported: (bookingId: string) => void;
}> = ({ bookingId, classTitle, onOpenChange, onReported }) => {
  const [reason, setReason] = useState<DisputeReason | "">("");
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!bookingId) return;
    setReason("");
    setDetails("");
  }, [bookingId]);

  const submit = async () => {
    if (!bookingId || !reason) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Couldn't send your report");
      toast({ title: "Report sent", description: "The teacher's payment is on hold while we look into it. We'll let you know the outcome." });
      onReported(bookingId);
      onOpenChange(false);
    } catch (err) {
      toast({ title: "Couldn't send", description: errorMessage(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!bookingId} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Report a problem</DialogTitle>
          <DialogDescription>
            {classTitle}. The teacher isn&apos;t paid until MiniUni reviews your report. You can report a class until {DISPUTE_WINDOW_HOURS} hours after it ends.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2" role="radiogroup" aria-label="What went wrong">
          {(Object.entries(DISPUTE_REASONS) as [DisputeReason, string][]).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={reason === value}
              onClick={() => setReason(value)}
              disabled={saving}
              className={`w-full rounded-xl border px-4 py-2.5 text-left text-sm transition-colors ${reason === value
                ? "border-primary bg-primary/10 font-medium text-foreground"
                : "border-border/70 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="dispute-details" className="text-sm font-medium">What happened?</label>
          <Textarea
            id="dispute-details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            maxLength={2000}
            rows={4}
            placeholder="e.g. I waited 20 minutes and the teacher never joined."
            disabled={saving}
          />
          <p className="text-xs text-muted-foreground">The teacher will see your report and can reply.</p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button variant="hero" onClick={submit} disabled={!reason || details.trim().length < 10 || saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/** Teacher: give their side of an open report. */
export const DisputeResponseDialog: React.FC<{
  bookingId: string | null;
  dispute?: BookingDispute | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (bookingId: string, response: string) => void;
}> = ({ bookingId, dispute, onOpenChange, onSaved }) => {
  const [response, setResponse] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (bookingId) setResponse(dispute?.teacherResponse ?? "");
  }, [bookingId, dispute]);

  const save = async () => {
    if (!bookingId || !response.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/dispute`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Couldn't save your response");
      toast({ title: "Response saved", description: "MiniUni will consider it when reviewing the report." });
      onSaved(bookingId, data.teacherResponse);
      onOpenChange(false);
    } catch (err) {
      toast({ title: "Couldn't save", description: errorMessage(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const reasonLabel = dispute ? DISPUTE_REASONS[dispute.reason as DisputeReason] ?? dispute.reason : "";

  return (
    <Dialog open={!!bookingId} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Your side of the report</DialogTitle>
          <DialogDescription>The payment for this class is on hold until MiniUni reviews the report.</DialogDescription>
        </DialogHeader>

        {dispute && (
          <div className="rounded-xl bg-muted/60 p-3 text-sm">
            <p className="font-medium">{reasonLabel}</p>
            <p className="mt-1 whitespace-pre-line text-muted-foreground">{dispute.details}</p>
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="dispute-response" className="text-sm font-medium">What happened from your side?</label>
          <Textarea
            id="dispute-response"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            maxLength={2000}
            rows={4}
            placeholder="e.g. I joined on time and waited 15 minutes. Screenshot available."
            disabled={saving}
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button variant="hero" onClick={save} disabled={!response.trim() || saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save response
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/** The report's state, shown under a class card for either side. */
export const DisputeSummary: React.FC<{ dispute: BookingDispute; viewer: "student" | "teacher" }> = ({ dispute, viewer }) => {
  const reasonLabel = DISPUTE_REASONS[dispute.reason as DisputeReason] ?? dispute.reason;
  const outcome =
    dispute.status === "REFUNDED"
      ? viewer === "student" ? "Refunded to your wallet" : "Student refunded"
      : dispute.status === "RELEASED"
        ? viewer === "student" ? "Reviewed: the teacher was paid" : "Reviewed: payment released"
        : "Under review. Payment on hold";
  return (
    <div className="mt-3 rounded-xl border border-warning/30 bg-warning/5 p-3 text-xs">
      <p className="font-medium text-foreground">
        Reported: {reasonLabel} <span className="font-normal text-muted-foreground">· {outcome}</span>
      </p>
      {viewer === "teacher" && <p className="mt-1 whitespace-pre-line text-muted-foreground">&ldquo;{dispute.details}&rdquo;</p>}
      {dispute.teacherResponse && (
        <p className="mt-1 whitespace-pre-line text-muted-foreground">
          <span className="font-medium text-foreground">{viewer === "teacher" ? "Your response" : "Teacher's response"}:</span> {dispute.teacherResponse}
        </p>
      )}
      {dispute.resolutionNote && (
        <p className="mt-1 whitespace-pre-line text-muted-foreground">
          <span className="font-medium text-foreground">MiniUni:</span> {dispute.resolutionNote}
        </p>
      )}
    </div>
  );
};
