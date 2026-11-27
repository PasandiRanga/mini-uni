import React, { useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Paperclip, X, FileText, Film, ImageIcon } from "lucide-react";
import { DISPUTE_REASONS, DISPUTE_WINDOW_HOURS, type DisputeReason } from "@/lib/disputeReasons";

export type BookingDispute = {
  reason: string;
  details: string;
  evidenceUrls?: string[];
  status: string; // OPEN | REFUNDED | RELEASED
  teacherResponse?: string | null;
  resolutionNote?: string | null;
  createdAt?: string;
};

type Evidence = { url: string; name: string; type: string };
const MAX_EVIDENCE = 5;
const MAX_EVIDENCE_BYTES = 50 * 1024 * 1024;
const ACCEPT = "image/*,application/pdf,video/*";

const evidenceIcon = (url: string) =>
  /\.(mp4|webm|mov)(\?|$)/i.test(url) ? Film : /\.pdf(\?|$)/i.test(url) ? FileText : ImageIcon;

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
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!bookingId) return;
    setReason("");
    setDetails("");
    setEvidence([]);
  }, [bookingId]);

  const onPickFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = ""; // allow re-picking the same file
    if (!picked.length) return;
    const room = MAX_EVIDENCE - evidence.length;
    if (room <= 0) {
      toast({ title: `Up to ${MAX_EVIDENCE} files`, variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      for (const file of picked.slice(0, room)) {
        if (file.size > MAX_EVIDENCE_BYTES) {
          toast({ title: `${file.name} is too big`, description: "Each file must be 50 MB or smaller.", variant: "destructive" });
          continue;
        }
        try {
          const blob = await upload(file.name, file, {
            access: "public",
            handleUploadUrl: "/api/disputes/upload",
            contentType: file.type,
          });
          setEvidence((prev) => [...prev, { url: blob.url, name: file.name, type: file.type }]);
        } catch {
          toast({ title: `Couldn't upload ${file.name}`, description: "File uploads may not be set up. Try again or send without it.", variant: "destructive" });
        }
      }
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!bookingId || !reason) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details, evidenceUrls: evidence.map((f) => f.url) }),
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Evidence <span className="font-normal text-muted-foreground">(optional)</span></label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={saving || uploading || evidence.length >= MAX_EVIDENCE}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}
              Add file
            </Button>
          </div>
          <input ref={fileRef} type="file" accept={ACCEPT} multiple hidden onChange={onPickFiles} />
          <p className="text-xs text-muted-foreground">Screenshots, a PDF, or a short screen recording. Up to {MAX_EVIDENCE} files, 50 MB each.</p>
          {evidence.length > 0 && (
            <ul className="space-y-1.5">
              {evidence.map((f, i) => {
                const Icon = evidenceIcon(f.url);
                return (
                  <li key={f.url} className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-sm">
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{f.name}</span>
                    <button type="button" onClick={() => setEvidence((prev) => prev.filter((_, j) => j !== i))} disabled={saving} className="text-muted-foreground hover:text-destructive" aria-label={`Remove ${f.name}`}>
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button variant="hero" onClick={submit} disabled={!reason || details.trim().length < 10 || saving || uploading}>
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
      {dispute.evidenceUrls && dispute.evidenceUrls.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {dispute.evidenceUrls.map((url, i) => {
            const Icon = evidenceIcon(url);
            return (
              <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-background px-2 py-1 text-[11px] text-foreground hover:bg-muted">
                <Icon className="h-3 w-3" /> Evidence {i + 1}
              </a>
            );
          })}
        </div>
      )}
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
