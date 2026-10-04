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
import { startPayHereCheckout, type PayHereCheckout } from "@/lib/payhereClient";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Loader2,
  Plus,
  Receipt,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Wallet as WalletIcon,
} from "lucide-react";

type TxType = "TOP_UP" | "PAYMENT" | "REFUND" | "DEPOSIT" | "RELEASE" | "WITHDRAWAL" | "REVERSAL";

interface Transaction {
  id: string;
  type: TxType;
  amount: string | number;
  status: string;
  description?: string | null;
  createdAt: string;
  title?: string | null;
  teacherName?: string | null;
}

interface UnpaidBooking {
  bookingId: string;
  amount: string | number;
  startTime: string | null;
  title: string;
  teacherName: string;
}

interface WalletData {
  releasedBalance: string | number;
  totalSpent: string | number;
  currency: string;
  minTopUp: number;
  transactions: Transaction[];
  unpaidBookings: UnpaidBooking[];
}

const TX_LABELS: Record<TxType, string> = {
  TOP_UP: "Money added",
  PAYMENT: "Class payment",
  REFUND: "Refund",
  DEPOSIT: "Payment received",
  RELEASE: "Released",
  WITHDRAWAL: "Withdrawal",
  REVERSAL: "Reversed",
};

const TX_ICONS: Record<TxType, typeof ArrowDownLeft> = {
  TOP_UP: Plus,
  PAYMENT: ArrowUpRight,
  REFUND: RotateCcw,
  DEPOSIT: ArrowDownLeft,
  RELEASE: ArrowDownLeft,
  WITHDRAWAL: ArrowUpRight,
  REVERSAL: ArrowUpRight,
};

const OUTGOING: TxType[] = ["PAYMENT", "WITHDRAWAL", "REVERSAL"];

const FILTERS = [
  { id: "all", label: "All activity" },
  { id: "in", label: "Money in" },
  { id: "payments", label: "Payments" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

const QUICK_TOP_UPS: Record<string, number[]> = {
  LKR: [1000, 2500, 5000],
  USD: [10, 25, 50],
};

const StudentWallet: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterId>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [paying, setPaying] = useState<string | null>(null);

  const currency = wallet?.currency || user?.currency;
  const balance = Number(wallet?.releasedBalance ?? 0);
  const min = wallet?.minTopUp ?? 0;
  const quickAmounts = QUICK_TOP_UPS[currency || "LKR"] || QUICK_TOP_UPS.LKR;

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
    if (filter === "in") return all.filter((t) => t.type === "TOP_UP" || t.type === "REFUND");
    if (filter === "payments") return all.filter((t) => t.type === "PAYMENT");
    return all;
  }, [wallet?.transactions, filter]);

  /**
   * PayHere tells the browser the checkout is *finished*, not that it
   * succeeded — the payment only counts once its notification reaches us. So we
   * read the result back from our own records for a few seconds.
   */
  const settle = useCallback(async (orderId: string, localConfirm: boolean, successTitle: string) => {
    setVerifying(true);
    try {
      // Sandbox on localhost, where PayHere can't reach the notify URL.
      if (localConfirm) await fetch(`/api/payments/payhere/confirm/${orderId}`, { method: "POST" });

      for (let attempt = 0; attempt < 8; attempt++) {
        const res = await fetch(`/api/payments/payhere/status/${orderId}`);
        const data = res.ok ? await res.json() : null;

        if (data?.status === "COMPLETED") {
          toast({ title: successTitle, description: "Your balance is up to date." });
          return;
        }
        if (data?.status === "FAILED") {
          toast({ title: "Payment didn't go through", description: "Nothing was charged.", variant: "destructive" });
          return;
        }
        await new Promise((r) => setTimeout(r, 1500));
      }

      toast({
        title: "Payment is still being confirmed",
        description: "PayHere hasn't confirmed it yet. This screen updates as soon as it does.",
      });
    } finally {
      setVerifying(false);
      fetchWallet();
    }
  }, [fetchWallet, toast]);

  const topUp = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/wallets/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount) }),
      });
      const data: {
        error?: string;
        transactionId: string;
        orderId: string;
        checkout: PayHereCheckout;
        localConfirm: boolean;
      } = await res.json();
      if (!res.ok) throw new Error(data.error || "Top-up failed");

      setDialogOpen(false);
      setAmount("");

      await startPayHereCheckout(data.checkout, {
        onCompleted: (orderId) => settle(orderId || data.orderId, data.localConfirm, "Wallet topped up"),
        onDismissed: () => {
          // Nothing was paid — drop the pending transaction.
          fetch(`/api/wallets/topup/${data.transactionId}`, { method: "DELETE" }).finally(fetchWallet);
        },
        onError: (error) => {
          toast({ title: "Couldn't add money", description: error || "Try again", variant: "destructive" });
          fetch(`/api/wallets/topup/${data.transactionId}`, { method: "DELETE" }).finally(fetchWallet);
        },
      });
    } catch (err: unknown) {
      toast({
        title: "Couldn't add money",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const payByCard = async (booking: UnpaidBooking) => {
    setPaying(booking.bookingId);
    try {
      const res = await fetch("/api/payments/payhere/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.bookingId }),
      });
      const data: { error?: string; orderId: string; checkout: PayHereCheckout; localConfirm: boolean } =
        await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't start the payment");

      await startPayHereCheckout(data.checkout, {
        onCompleted: (orderId) => settle(orderId || data.orderId, data.localConfirm, "Class paid for"),
        onDismissed: () => fetchWallet(),
        onError: (error) =>
          toast({ title: "Couldn't pay", description: error || "Try again", variant: "destructive" }),
      });
    } catch (err: unknown) {
      toast({
        title: "Couldn't pay",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setPaying(null);
    }
  };

  const payFromWallet = async (booking: UnpaidBooking) => {
    setPaying(booking.bookingId);
    try {
      const res = await fetch("/api/payments/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.bookingId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment failed");

      toast({
        title: "Class paid for",
        description: `${formatMoney(booking.amount, currency)} paid from your wallet. Your class is confirmed.`,
      });
      fetchWallet();
    } catch (err: unknown) {
      toast({
        title: "Couldn't pay",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setPaying(null);
    }
  };

  const amountNum = Number(amount);
  const amountError =
    amount === "" ? null
      : !Number.isFinite(amountNum) || amountNum <= 0 ? "Enter a valid amount"
      : amountNum < min ? `The minimum top-up is ${formatMoney(min, currency)}`
      : null;

  const canSubmit = !submitting && amount !== "" && !amountError;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-normal sm:text-3xl">
            Your <span className="font-serif text-gradient font-semibold">wallet</span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Refunds from cancelled classes land here, and you can add money any time to pay for a class without a card.
          </p>
        </div>
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={fetchWallet} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {verifying && (
        <div className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/[0.06] px-5 py-4 text-sm">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
          <p>Confirming your payment with PayHere — this usually takes a few seconds.</p>
        </div>
      )}

      {/* Balance — ink card */}
      <div className="relative overflow-hidden rounded-3xl bg-foreground p-7 text-background shadow-elevated grain sm:p-9">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-background/50">Available to spend</p>
            <p className="mb-7 font-serif text-4xl italic sm:text-5xl">{formatMoney(wallet?.releasedBalance, currency)}</p>
            <div className="grid grid-cols-2 gap-6 sm:max-w-sm sm:gap-10">
              <div>
                <p className="font-serif text-2xl italic sm:text-3xl">{formatMoney(wallet?.totalSpent, currency)}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-background/60">Spent from wallet</p>
              </div>
              <div>
                <p className="font-serif text-2xl italic sm:text-3xl">{wallet?.unpaidBookings?.length ?? 0}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-background/60">Awaiting payment</p>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 lg:w-72">
            <Button
              className="w-full bg-background text-foreground hover:bg-background/90"
              onClick={() => { setAmount(""); setDialogOpen(true); }}
              disabled={loading}
            >
              <Plus className="h-4 w-4" />
              Add money
            </Button>
            <div className="rounded-2xl border border-background/15 bg-background/5 p-4 text-sm">
              <p className="flex items-center gap-2 font-medium text-background/90">
                <ShieldCheck className="h-3.5 w-3.5" /> Cancellations
              </p>
              <p className="mt-2 text-xs text-background/70">
                If a class is cancelled before it happens, the full amount comes straight back here — no waiting on a card refund.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Classes waiting to be paid for */}
      {(wallet?.unpaidBookings?.length ?? 0) > 0 && (
        <section className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft">
          <div className="flex items-center justify-between border-b border-border/60 px-6 py-5">
            <h3 className="text-lg font-normal">
              Awaiting <span className="font-serif font-semibold">payment</span>
              <span className="ml-2 text-sm font-normal text-muted-foreground">({wallet?.unpaidBookings.length})</span>
            </h3>
            <p className="hidden text-xs text-muted-foreground sm:block">Pay from your balance</p>
          </div>
          <div className="divide-y divide-border/60">
            {wallet?.unpaidBookings.map((b) => {
              const start = b.startTime ? new Date(b.startTime) : null;
              const affordable = Number(b.amount) <= balance;
              return (
                <div key={b.bookingId} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{b.title}</p>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {b.teacherName || "Teacher"}
                      {start && (
                        <>
                          {" · "}
                          {start.toLocaleString(undefined, {
                            month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                          })}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
                    <p className="font-semibold">{formatMoney(b.amount, currency)}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => payByCard(b)}
                      disabled={paying === b.bookingId}
                    >
                      <CreditCard className="h-4 w-4" /> Pay by card
                    </Button>
                    {affordable ? (
                      <Button size="sm" onClick={() => payFromWallet(b)} disabled={paying === b.bookingId}>
                        {paying === b.bookingId
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <WalletIcon className="h-4 w-4" />}
                        Pay from wallet
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => {
                          setAmount(String(Math.max(Number(b.amount) - balance, min)));
                          setDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4" /> Add money
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Activity */}
      <section className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-6 py-5">
          <h3 className="text-lg font-normal">
            Transaction <span className="font-serif font-semibold">history</span>
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
                {filter === "all"
                  ? "No transactions yet. Money you add, spend or get refunded shows up here."
                  : "Nothing to show for this filter."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((t) => {
                const Icon = TX_ICONS[t.type] ?? Receipt;
                const outgoing = OUTGOING.includes(t.type);
                return (
                  <div key={t.id} className="flex items-center gap-4 rounded-2xl border border-border/70 bg-background/40 p-4">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${outgoing ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{TX_LABELS[t.type] ?? "Transaction"}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {t.title || t.description}
                        {t.teacherName ? ` · ${t.teacherName}` : ""}
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

      {/* Top-up dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!submitting) setDialogOpen(o); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add money to your wallet</DialogTitle>
            <DialogDescription>
              Top up with PayHere, then pay for classes straight from your balance.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="topup-amount">Amount</Label>
              <Input
                id="topup-amount"
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                autoFocus
              />
              <p className={`text-xs ${amountError ? "text-destructive" : "text-muted-foreground"}`}>
                {amountError || `Minimum ${formatMoney(min, currency)} · current balance ${formatMoney(balance, currency)}`}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setAmount(String(q))}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${Number(amount) === q
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/70 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                    }`}
                >
                  {formatMoney(q, currency)}
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-border/70 bg-muted/40 p-4 text-sm">
              <p className="flex items-center gap-2 font-medium">
                <CreditCard className="h-3.5 w-3.5" /> Paid securely through PayHere
              </p>
              <p className="mt-1 text-muted-foreground">
                Card details go straight to PayHere, never to us. Money added to your wallet stays yours — spend it on any class, any time.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="hero" onClick={topUp} disabled={!canSubmit}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Add {amount && !amountError ? formatMoney(amountNum, currency) : "money"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentWallet;
