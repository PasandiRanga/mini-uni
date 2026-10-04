'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatMoney } from "@/lib/currency";
import {
  GraduationCap,
  ShieldCheck,
  Wallet,
  LogOut,
  Loader2,
  CheckCircle2,
  XCircle,
  FileText,
  Mail,
  Phone,
  MapPin,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

/* -------------------------------------------------------------------------- */

const DOC_LABELS: Record<string, string> = {
  ID: "Identity document",
  ID_FRONT: "ID — front",
  ID_BACK: "ID — back",
  UNIVERSITY_ID: "University ID",
  ADDRESS_PROOF: "Proof of address",
  BANK_DETAILS: "Bank details",
};

const docLabel = (t: string) => DOC_LABELS[t] || t;

const statusTone: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  APPROVED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  REJECTED: "bg-destructive/10 text-destructive border-destructive/20",
  PROCESSING: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  PAID: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  CANCELLED: "bg-muted text-muted-foreground border-border",
};

const StatusBadge = ({ status }: { status: string }) => (
  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusTone[status] || "bg-muted text-muted-foreground border-border"}`}>
    {status}
  </span>
);

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

/* -------------------------------------------------------------------------- */

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch {
      /* no-op */
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-hero">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              Mini<span className="font-serif italic font-normal">Uni</span>
            </span>
            <Badge variant="secondary" className="ml-1 gap-1">
              <ShieldCheck className="h-3 w-3" /> Admin
            </Badge>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user ? `${user.firstName} ${user.lastName}` : "Admin"}
            </span>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout" className="rounded-full border border-border/70">
              <LogOut className="h-[18px] w-[18px]" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold sm:text-3xl">Admin console</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review teacher verifications and process withdrawal payouts.
          </p>
        </div>

        <Tabs defaultValue="teachers" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="teachers" className="gap-2">
              <ShieldCheck className="h-4 w-4" /> Teacher verification
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="gap-2">
              <Wallet className="h-4 w-4" /> Withdrawals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="teachers">
            <TeacherReview toast={toast} />
          </TabsContent>
          <TabsContent value="withdrawals">
            <WithdrawalReview toast={toast} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

/* -------------------------------------------------------------------------- *
 * Teacher verification queue
 * -------------------------------------------------------------------------- */

const TEACHER_FILTERS = ["PENDING", "APPROVED", "REJECTED"] as const;

const TeacherReview = ({ toast }: { toast: any }) => {
  const [status, setStatus] = useState<(typeof TEACHER_FILTERS)[number]>("PENDING");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  // A failed load must not look like an empty queue.
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await fetch(`/api/admin/teachers?status=${status}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      setItems([]);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TEACHER_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatus(f)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                status === f
                  ? "border-primary bg-primary/[0.08] text-primary"
                  : "border-border/70 text-muted-foreground hover:bg-muted/60"
              }`}
            >
              {f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={load} className="gap-2 text-muted-foreground">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {loading ? (
        <Loading />
      ) : loadError ? (
        <LoadFailed onRetry={load} />
      ) : items.length === 0 ? (
        <Empty
          icon={ShieldCheck}
          title={status === "PENDING" ? "No teachers awaiting review" : `No ${status.toLowerCase()} teachers`}
          subtitle={status === "PENDING" ? "New submissions that reach 100% will appear here." : undefined}
        />
      ) : (
        <div className="grid gap-3">
          {items.map((t) => (
            <button
              key={t.userId}
              onClick={() => setSelected(t.userId)}
              className="group flex items-center gap-4 rounded-2xl border border-border/70 bg-card/80 p-4 text-left shadow-card transition-all hover:border-primary/40 hover:shadow-soft"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full gradient-hero text-sm font-semibold text-primary-foreground">
                {(t.name || t.email || "?").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">{t.fullName || t.name}</p>
                  <StatusBadge status={t.verificationStatus} />
                </div>
                <p className="truncate text-sm text-muted-foreground">{t.email}</p>
                {t.subjects?.length > 0 && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{t.subjects.join(" · ")}</p>
                )}
              </div>
              <div className="hidden shrink-0 text-right text-xs text-muted-foreground sm:block">
                <p>{t.documentCount} doc{t.documentCount === 1 ? "" : "s"}</p>
                <p>Submitted {fmtDate(t.submittedAt)}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <TeacherDetailDialog
          userId={selected}
          onClose={() => setSelected(null)}
          onReviewed={() => {
            setSelected(null);
            load();
          }}
          toast={toast}
        />
      )}
    </div>
  );
};

/** Shown when a list or detail couldn't be fetched, with a retry. */
const LoadFailed = ({ onRetry }: { onRetry: () => void }) => (
  <div className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/[0.04] px-6 py-10 text-center">
    <p className="text-sm font-medium">Couldn&apos;t load this. It may be a server or database problem.</p>
    <Button variant="outline" size="sm" className="gap-2" onClick={onRetry}>
      <RefreshCw className="h-4 w-4" /> Try again
    </Button>
  </div>
);

/**
 * ID scans are stored as data: URLs, which browsers refuse to open in a new
 * tab. Turn one into a blob URL first so images and PDFs both open.
 */
const openDocument = async (e: React.MouseEvent, url: string) => {
  if (!url?.startsWith("data:")) return;
  e.preventDefault();
  // Open synchronously (inside the click) so pop-up blockers allow it.
  const win = window.open("", "_blank");
  try {
    const blob = await (await fetch(url)).blob();
    const objectUrl = URL.createObjectURL(blob);
    if (win) win.location.href = objectUrl;
    else window.location.href = objectUrl;
  } catch {
    win?.close();
  }
};

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="text-sm">{value && value.trim() ? value : "—"}</p>
  </div>
);

const TeacherDetailDialog = ({
  userId,
  onClose,
  onReviewed,
  toast,
}: {
  userId: string;
  onClose: () => void;
  onReviewed: () => void;
  toast: any;
}) => {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const res = await fetch(`/api/admin/teachers/${userId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (active) setDetail(data);
      } catch {
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [userId, reloadKey]);

  const act = async (kind: "approve" | "reject") => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/teachers/${userId}/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: kind === "reject" ? JSON.stringify({ reason: reason.trim() }) : undefined,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        // Already decided (another admin, or a double click): show the latest state.
        if (res.status === 409) onReviewed();
        throw new Error(err.error || "Action failed");
      }
      toast({
        title: kind === "approve" ? "Teacher approved" : "Teacher rejected",
        description:
          kind === "approve"
            ? "They can now post classes and take bookings."
            : "They've been told what to fix and can re-submit.",
      });
      onReviewed();
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const p = detail?.personal;
  const a = detail?.academic;
  const isPending = detail?.verificationStatus === "PENDING";

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {detail ? p?.fullName || `${detail.user.firstName} ${detail.user.lastName}` : "Loading…"}
            {detail && <StatusBadge status={detail.verificationStatus} />}
          </DialogTitle>
          <DialogDescription>Review the submitted details and documents before deciding.</DialogDescription>
        </DialogHeader>

        {loadError ? (
          <LoadFailed onRetry={() => setReloadKey((n) => n + 1)} />
        ) : loading || !detail ? (
          <Loading />
        ) : (
          <div className="space-y-6">
            {/* Contact */}
            <div className="grid grid-cols-1 gap-3 rounded-xl border border-border/60 bg-muted/30 p-4 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" /> {detail.user.email}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" /> {p?.contactNumber || detail.user.phone || "—"}
              </div>
              <div className="flex items-center gap-2 text-sm sm:col-span-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                {[p?.address, p?.postalCode, p?.country].filter(Boolean).join(", ") || "—"}
              </div>
            </div>

            {/* Personal */}
            <section>
              <h3 className="mb-3 text-sm font-semibold">Personal details</h3>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Full name" value={p?.fullName} />
                <Field label="Name with initials" value={p?.nameWithInitials} />
                <Field label="Secondary contact" value={p?.contactNumber2} />
                <Field label="ID type" value={detail.identity?.idType} />
              </div>
            </section>

            {/* Academic */}
            <section>
              <h3 className="mb-3 text-sm font-semibold">Academic / professional</h3>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Employment status" value={a?.employmentStatus} />
                {a?.employmentStatus === "STUDENT" ? (
                  <>
                    <Field label="School" value={a?.universityName} />
                    <Field label="Country" value={a?.universityCountry} />
                    <Field label="A/L stream" value={a?.stream} />
                    <Field label="A/L exam year" value={a?.examYear} />
                  </>
                ) : a?.employmentStatus === "UNDERGRADUATE" ? (
                  <>
                    <Field label="University" value={a?.universityName} />
                    <Field label="University country" value={a?.universityCountry} />
                  </>
                ) : a?.employmentStatus === "GRADUATE" ? (
                  <>
                    <Field label="Working status" value={a?.workingStatus} />
                    <Field label="Profession" value={a?.profession} />
                    <Field label="Employer" value={a?.employer} />
                  </>
                ) : null}
              </div>
            </section>

            {/* Teaching */}
            {(detail.teaching?.subjects?.length > 0 || detail.teaching?.bio) && (
              <section>
                <h3 className="mb-3 text-sm font-semibold">Teaching</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Subjects" value={detail.teaching?.subjects?.join(", ")} />
                  <Field label="Experience" value={detail.teaching?.experience != null ? `${detail.teaching.experience} yrs` : null} />
                </div>
                {detail.teaching?.bio && <p className="mt-3 text-sm text-muted-foreground">{detail.teaching.bio}</p>}
              </section>
            )}

            {/* Documents */}
            <section>
              <h3 className="mb-3 text-sm font-semibold">Documents ({detail.documents.length})</h3>
              {detail.documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No documents uploaded.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {detail.documents.map((d: any) => (
                    <a
                      key={d.id}
                      href={d.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => openDocument(e, d.documentUrl)}
                      className="group relative block overflow-hidden rounded-xl border border-border/70 bg-muted/30"
                    >
                      {/\.(png|jpe?g|gif|webp|avif)$/i.test(d.documentUrl) || d.documentUrl?.startsWith("data:image") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={d.documentUrl} alt={docLabel(d.documentType)} className="aspect-[4/3] w-full object-cover" />
                      ) : (
                        <div className="flex aspect-[4/3] w-full items-center justify-center">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-1 border-t border-border/60 px-2.5 py-2">
                        <span className="truncate text-xs font-medium">{docLabel(d.documentType)}</span>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </section>

            {isPending && detail.complete === false && (
              <p className="rounded-xl border border-warning/40 bg-warning/[0.08] px-4 py-3 text-sm">
                Not ready to approve: missing{" "}
                {(detail.steps || []).filter((s: any) => !s.complete).map((s: any) => s.label.toLowerCase()).join(", ")}.
              </p>
            )}

            {/* Reject reason input */}
            {rejecting && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/[0.04] p-4">
                <label className="mb-2 block text-sm font-medium">Reason for rejection</label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Tell the teacher what to fix so they can re-submit…"
                  rows={3}
                />
              </div>
            )}
          </div>
        )}

        {detail && isPending && (
          <DialogFooter className="gap-2 sm:gap-2">
            {rejecting ? (
              <>
                <Button variant="ghost" onClick={() => setRejecting(false)} disabled={submitting}>
                  Back
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => act("reject")}
                  disabled={submitting || !reason.trim()}
                  className="gap-2"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  Confirm rejection
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setRejecting(true)} disabled={submitting} className="gap-2 text-destructive">
                  <XCircle className="h-4 w-4" /> Reject
                </Button>
                <Button onClick={() => act("approve")} disabled={submitting || detail.complete === false} className="gap-2">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

/* -------------------------------------------------------------------------- *
 * Withdrawal queue
 * -------------------------------------------------------------------------- */

const WITHDRAWAL_FILTERS = ["PENDING", "PROCESSING", "PAID", "REJECTED"] as const;

const WithdrawalReview = ({ toast }: { toast: any }) => {
  const [status, setStatus] = useState<(typeof WITHDRAWAL_FILTERS)[number]>("PENDING");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/withdrawals?status=${status}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id: string, action: "process" | "paid" | "reject", extra?: Record<string, string>) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Action failed");
      }
      toast({ title: "Done", description: `Withdrawal marked ${action === "process" ? "processing" : action}.` });
      setRejectId(null);
      setNote("");
      load();
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {WITHDRAWAL_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatus(f)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                status === f
                  ? "border-primary bg-primary/[0.08] text-primary"
                  : "border-border/70 text-muted-foreground hover:bg-muted/60"
              }`}
            >
              {f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={load} className="gap-2 text-muted-foreground">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <Empty icon={Wallet} title={`No ${status.toLowerCase()} withdrawals`} />
      ) : (
        <div className="grid gap-3">
          {items.map((w) => {
            const open = w.status === "PENDING" || w.status === "PROCESSING";
            return (
              <div key={w.id} className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold">{formatMoney(w.amount, w.currency)}</p>
                      <StatusBadge status={w.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {w.teacher?.name || "Unknown teacher"} · {w.teacher?.email}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Requested {fmtDate(w.createdAt)}</p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl border border-border/60 bg-muted/30 p-3 text-sm sm:grid-cols-4">
                  <Field label="Account name" value={w.bankAccountName} />
                  <Field label="Account no." value={w.bankAccountNumber} />
                  <Field label="Bank" value={w.bankName} />
                  <Field label="Branch" value={w.bankBranch} />
                </div>

                {w.note && <p className="mt-2 text-sm text-muted-foreground">Note: {w.note}</p>}
                {w.reference && <p className="mt-1 text-xs text-muted-foreground">Ref: {w.reference}</p>}

                {open && (
                  <div className="mt-4">
                    {rejectId === w.id ? (
                      <div className="space-y-2">
                        <Input
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="Reason for rejection (returns money to the teacher)"
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => { setRejectId(null); setNote(""); }} disabled={busyId === w.id}>
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => act(w.id, "reject", { note: note.trim() })}
                            disabled={busyId === w.id || !note.trim()}
                            className="gap-2"
                          >
                            {busyId === w.id && <Loader2 className="h-4 w-4 animate-spin" />} Confirm reject
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setRejectId(w.id)} disabled={busyId === w.id} className="text-destructive">
                          Reject
                        </Button>
                        {w.status === "PENDING" && (
                          <Button variant="outline" size="sm" onClick={() => act(w.id, "process")} disabled={busyId === w.id} className="gap-2">
                            {busyId === w.id && <Loader2 className="h-4 w-4 animate-spin" />} Mark processing
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => {
                            const reference = window.prompt("Payout reference (optional)") || undefined;
                            act(w.id, "paid", reference ? { reference } : undefined);
                          }}
                          disabled={busyId === w.id}
                          className="gap-2"
                        >
                          {busyId === w.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Mark paid
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */

const Loading = () => (
  <div className="flex items-center justify-center py-16">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

const Empty = ({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 py-16 text-center">
    <Icon className="mb-3 h-8 w-8 text-muted-foreground" />
    <p className="font-medium">{title}</p>
    {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
  </div>
);

export default AdminDashboard;
