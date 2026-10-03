'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { formatMoney } from "@/lib/currency";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Clock,
  Landmark,
  Loader2,
  Receipt,
  RefreshCw,
  Wallet as WalletIcon,
  X,
} from "lucide-react";

type TxType = "DEPOSIT" | "RELEASE" | "COMMISSION" | "WITHDRAWAL" | "REFUND" | "REVERSAL" | "TOP_UP" | "PAYMENT";

interface Transaction {
  id: string;
  type: TxType;
  amount: string | number;
  status: string;
  description?: string | null;
  createdAt: string;
  title?: string | null;
  studentName?: string | null;
}

interface Withdrawal {
  id: string;
  amount: string | number;
  currency: string;
  status: "PENDING" | "PROCESSING" | "PAID" | "REJECTED" | "CANCELLED";
  bankName?: string | null;
  bankAccountNumber?: string | null;
  reference?: string | null;
  note?: string | null;
  processedAt?: string | null;
  createdAt: string;
}

interface Hold {
  bookingId: string;
  amount: string | number;
  netAmount: string | number;
  releasesAt: string | null;
  startTime: string | null;
  title: string;
  studentName: string;
}

interface WalletData {
  pendingBalance: string | number;
  releasedBalance: string | number;
  totalEarnings: string | number;
  currency: string;
  minWithdrawal: number;
  transactions: Transaction[];
  withdrawals: Withdrawal[];
  holds: Hold[];
  commissionPercent: number;
  hasBankDetails: boolean;
  bankDetails?: {
    bankAccountName?: string | null;
    bankAccountNumber?: string | null;
    bankName?: string | null;
    bankBranch?: string | null;
  } | null;
}

const TX_LABELS: Record<TxType, string> = {
  DEPOSIT: "Payment received",
  RELEASE: "Earnings released",
  COMMISSION: "Service fee",
  WITHDRAWAL: "Withdrawal",
  REFUND: "Refund",
  REVERSAL: "Class cancelled",
  TOP_UP: "Money added",
  PAYMENT: "Class payment",
};

// Deposits are informational — the money they represent is already counted in
// the release, so only releases and withdrawals move the withdrawable balance.
const TX_ICONS: Record<TxType, typeof ArrowDownLeft> = {
  DEPOSIT: Clock,
  RELEASE: ArrowDownLeft,
  COMMISSION: ArrowUpRight,
  WITHDRAWAL: ArrowUpRight,
  REFUND: ArrowDownLeft,
  REVERSAL: ArrowUpRight,
  TOP_UP: ArrowDownLeft,
  PAYMENT: ArrowUpRight,
};

const WITHDRAWAL_STATUS_STYLES: Record<Withdrawal["status"], string> = {
  PENDING: "bg-warning/15 text-warning",
  PROCESSING: "bg-primary/10 text-primary",
  PAID: "bg-success/15 text-success",
  REJECTED: "bg-destructive/10 text-destructive",
  CANCELLED: "bg-muted text-muted-foreground",
};

const WITHDRAWAL_STATUS_LABELS: Record<Withdrawal["status"], string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  PAID: "Paid",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

const maskAccount = (n?: string | null) => (n && n.length > 4 ? `•••• ${n.slice(-4)}` : n || "—");

const FILTERS = [
  { id: "all", label: "All activity" },
  { id: "earnings", label: "Earnings" },
  { id: "withdrawals", label: "Withdrawals" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

interface TeacherWalletProps {
  /** Opens the dashboard's Settings tab, where bank details live. */
  onOpenSettings?: () => void;
}

const TeacherWallet: React.FC<TeacherWalletProps> = ({ onOpenSettings }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterId>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const currency = wallet?.currency || user?.currency;
  const available = Number(wallet?.releasedBalance ?? 0);
  const min = wallet?.minWithdrawal ?? 0;

  const fetchWallet = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/wallets/me");
      if (res.ok) setWallet(await res.json());
    } catch {
      /* ignore — the empty state covers it */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const transactions = useMemo(() => {
    const all = wallet?.transactions || [];
    if (filter === "earnings") return all.filter((t) => t.type === "DEPOSIT" || t.type === "RELEASE" || t.type === "COMMISSION" || t.type === "REVERSAL");
    if (filter === "withdrawals") return all.filter((t) => t.type === "WITHDRAWAL" || t.type === "REFUND");
    return all;
  }, [wallet?.transactions, filter]);

  const withdraw = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/wallets/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Withdrawal failed");

      setDialogOpen(false);
      setAmount("");
      toast({
        title: "Withdrawal requested",
        description: `${formatMoney(Number(amount), currency)} is on its way to your bank account.`,
      });
      fetchWallet();
    } catch (err: unknown) {
      toast({
        title: "Couldn't withdraw",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = async (id: string) => {
    setCancelling(id);
    try {
      const res = await fetch(`/api/wallets/withdrawals/${id}/cancel`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't cancel");
      toast({ title: "Withdrawal cancelled", description: "The amount is back in your available balance." });
      fetchWallet();
    } catch (err: unknown) {
      toast({
        title: "Couldn't cancel",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setCancelling(null);
    }
  };

  const amountNum = Number(amount);
  const amountError =
    amount === "" ? null
      : !Number.isFinite(amountNum) || amountNum <= 0 ? "Enter a valid amount"
      : amountNum < min ? `The minimum withdrawal is ${formatMoney(min, currency)}`
      : amountNum > available ? `You only have ${formatMoney(available, currency)} available`
      : null;

  const canSubmit = !submitting && amount !== "" && !amountError && wallet?.hasBankDetails;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold sm:text-3xl">
            Your <span className="font-serif font-normal text-gradient">wallet</span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Class payments are held safely until the class is over, then become available to withdraw.
          </p>
        </div>
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={fetchWallet} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Balances — ink card */}
      <div className="relative overflow-hidden rounded-3xl bg-foreground p-7 text-background shadow-elevated grain sm:p-9">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-background/50">Available to withdraw</p>
            <p className="mb-7 font-serif text-4xl italic sm:text-5xl">{formatMoney(wallet?.releasedBalance, currency)}</p>
            <div className="grid grid-cols-2 gap-6 sm:max-w-sm sm:gap-10">
              <div>
                <p className="font-serif text-2xl italic sm:text-3xl">{formatMoney(wallet?.pendingBalance, currency)}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-background/60">On hold</p>
              </div>
              <div>
                <p className="font-serif text-2xl italic sm:text-3xl">{formatMoney(wallet?.totalEarnings, currency)}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-background/60">All time</p>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 lg:w-72">
            <Button
              className="w-full bg-background text-foreground hover:bg-background/90"
              onClick={() => { setAmount(available > 0 ? String(available) : ""); setDialogOpen(true); }}
              disabled={loading || available <= 0}
            >
              <Banknote className="h-4 w-4" />
              Withdraw funds
            </Button>
            {available <= 0 && !loading && (
              <p className="text-center text-xs text-background/50">
                {Number(wallet?.pendingBalance ?? 0) > 0
                  ? "Your earnings become available once each class is over."
                  : "You have nothing to withdraw yet."}
              </p>
            )}
            <div className="rounded-2xl border border-background/15 bg-background/5 p-4 text-sm">
              <p className="flex items-center gap-2 font-medium text-background/90">
                <Landmark className="h-3.5 w-3.5" /> Payout account
              </p>
              {wallet?.hasBankDetails ? (
                <div className="mt-2 space-y-0.5 text-background/70">
                  <p>{wallet.bankDetails?.bankName}</p>
                  <p className="text-xs">{maskAccount(wallet.bankDetails?.bankAccountNumber)}</p>
                </div>
              ) : (
                <p className="mt-2 text-xs text-background/60">Not set up yet.</p>
              )}
              {onOpenSettings && (
                <button
                  onClick={onOpenSettings}
                  className="mt-3 text-xs font-medium text-background/90 underline underline-offset-4 hover:text-background"
                >
                  {wallet?.hasBankDetails ? "Change in Settings" : "Add bank details"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Money still in escrow */}
      {(wallet?.holds?.length ?? 0) > 0 && (
        <section className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft">
          <div className="flex items-center justify-between border-b border-border/60 px-6 py-5">
            <h3 className="text-lg font-semibold">
              On <span className="font-serif font-normal">hold</span>
              <span className="ml-2 text-sm font-normal text-muted-foreground">({wallet?.holds.length})</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Released when the class ends, less the {wallet?.commissionPercent ?? 0}% service fee
            </p>
          </div>
          <div className="divide-y divide-border/60">
            {wallet?.holds.map((h) => {
              const releasesAt = h.releasesAt ? new Date(h.releasesAt) : null;
              const isDue = releasesAt ? releasesAt.getTime() <= Date.now() : false;
              return (
                <div key={h.bookingId} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{h.title}</p>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {h.studentName || "Student"}
                      {releasesAt && (
                        <>
                          {" · "}
                          {isDue ? "releasing now" : `releases ${releasesAt.toLocaleString(undefined, {
                            month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                          })}`}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold">{formatMoney(h.netAmount ?? h.amount, currency)}</p>
                    <p className="text-xs text-muted-foreground">of {formatMoney(h.amount, currency)}</p>
                    <p className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> Held
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Withdrawal requests */}
      {(wallet?.withdrawals?.length ?? 0) > 0 && (
        <section className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft">
          <div className="border-b border-border/60 px-6 py-5">
            <h3 className="text-lg font-semibold">
              Withdrawal <span className="font-serif font-normal">requests</span>
            </h3>
          </div>
          <div className="divide-y divide-border/60">
            {wallet?.withdrawals.map((w) => (
              <div key={w.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{formatMoney(w.amount, w.currency || currency)}</p>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${WITHDRAWAL_STATUS_STYLES[w.status]}`}>
                      {WITHDRAWAL_STATUS_LABELS[w.status]}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {w.bankName || "Bank account"} · {maskAccount(w.bankAccountNumber)} ·{" "}
                    {formatDistanceToNow(new Date(w.createdAt), { addSuffix: true })}
                  </p>
                  {w.note && <p className="mt-1 text-xs text-muted-foreground">{w.note}</p>}
                  {w.reference && <p className="mt-1 text-xs text-muted-foreground">Ref: {w.reference}</p>}
                </div>
                {w.status === "PENDING" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => cancel(w.id)}
                    disabled={cancelling === w.id}
                  >
                    {cancelling === w.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                    Cancel
                  </Button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Activity */}
      <section className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-6 py-5">
          <h3 className="text-lg font-semibold">
            Transaction <span className="font-serif font-normal">history</span>
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${filter === f.id
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {loading && !wallet ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : transactions.length === 0 ? (
            <div className="py-10 text-center">
              <Receipt className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground">
                {filter === "all" ? "No transactions yet. Your class payments will show up here." : "Nothing to show for this filter."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((t) => {
                const Icon = TX_ICONS[t.type] ?? Receipt;
                const outgoing = t.type === "WITHDRAWAL" || t.type === "REVERSAL" || t.type === "COMMISSION";
                return (
                  <div key={t.id} className="flex items-center gap-4 rounded-2xl border border-border/70 bg-background/40 p-4">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${outgoing ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{TX_LABELS[t.type] ?? "Transaction"}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {t.title || t.description}
                        {t.studentName ? ` · ${t.studentName}` : ""}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}
                        {t.status !== "COMPLETED" && ` · ${t.status.toLowerCase()}`}
                      </p>
                    </div>
                    <p className={`shrink-0 font-semibold ${outgoing ? "text-muted-foreground" : "text-foreground"}`}>
                      {outgoing ? "−" : "+"}{formatMoney(t.amount, currency)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Withdraw dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!submitting) setDialogOpen(o); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw funds</DialogTitle>
            <DialogDescription>
              Transfers go to the bank account saved in your settings, and usually take 2–3 working days.
            </DialogDescription>
          </DialogHeader>

          {!wallet?.hasBankDetails ? (
            <div className="rounded-2xl border border-warning/40 bg-warning/[0.08] p-4 text-sm">
              <p className="font-medium">Add your bank details first</p>
              <p className="mt-1 text-muted-foreground">
                We need somewhere to send the money. You can add your account under Settings → Bank details.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="withdraw-amount">Amount</Label>
                <Input
                  id="withdraw-amount"
                  type="number"
                  min={0}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                />
                <div className="flex items-center justify-between text-xs">
                  <span className={amountError ? "text-destructive" : "text-muted-foreground"}>
                    {amountError || `Available: ${formatMoney(available, currency)} · minimum ${formatMoney(min, currency)}`}
                  </span>
                  <button
                    type="button"
                    className="font-medium text-primary hover:underline"
                    onClick={() => setAmount(String(available))}
                  >
                    Withdraw all
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-muted/40 p-4 text-sm">
                <p className="flex items-center gap-2 font-medium">
                  <Landmark className="h-3.5 w-3.5" /> {wallet.bankDetails?.bankName}
                </p>
                <p className="mt-1 text-muted-foreground">
                  {wallet.bankDetails?.bankAccountName} · {maskAccount(wallet.bankDetails?.bankAccountNumber)}
                  {wallet.bankDetails?.bankBranch ? ` · ${wallet.bankDetails.bankBranch}` : ""}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            {wallet?.hasBankDetails ? (
              <Button variant="hero" onClick={withdraw} disabled={!canSubmit}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Withdraw {amount && !amountError ? formatMoney(amountNum, currency) : ""}
              </Button>
            ) : (
              <Button variant="hero" onClick={() => { setDialogOpen(false); onOpenSettings?.(); }}>
                <WalletIcon className="h-4 w-4" /> Go to Settings
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherWallet;
