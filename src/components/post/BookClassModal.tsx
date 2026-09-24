'use client';

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatMoney } from "@/lib/currency";
import { CalendarClock, Wallet, ShieldAlert, Loader2, Check } from "lucide-react";

interface Slot {
  id: string;
  startTime: string;
  endTime: string;
  status?: string;
}
export interface BookablePost {
  id: string;
  title?: string;
  subject?: string;
  fee?: number;
  currency?: string;
  user?: { id?: string; firstName?: string; lastName?: string };
  timeSlots?: Slot[];
}

interface BookClassModalProps {
  post: BookablePost | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBooked?: () => void;
}

const BookClassModal = ({ post, open, onOpenChange, onBooked }: BookClassModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const currency = post?.currency || user?.currency;
  const emailVerified = Boolean(user?.emailVerified);

  const [slotId, setSlotId] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  // Available future slots only.
  const slots = useMemo(() => {
    const now = Date.now();
    return (post?.timeSlots || [])
      .filter((s) => (s.status ? s.status === "AVAILABLE" : true) && new Date(s.startTime).getTime() > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [post]);

  useEffect(() => {
    if (!open) return;
    setSlotId(slots[0]?.id ?? null);
    fetch("/api/wallets/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((w) => w && setBalance(Number(w.releasedBalance ?? 0)))
      .catch(() => setBalance(null));
  }, [open, slots]);

  if (!post) return null;

  const fee = Number(post.fee ?? 0);
  const teacher = `${post.user?.firstName || ""} ${post.user?.lastName || ""}`.trim() || "Teacher";
  const insufficient = balance !== null && balance < fee;
  const shortfall = insufficient ? fee - (balance ?? 0) : 0;

  const book = async () => {
    if (!slotId) return;
    setBusy(true);
    try {
      // 1) Reserve the slot + create the booking.
      const res = await fetch("/api/bookings/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id, timeSlotId: slotId }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "EMAIL_NOT_VERIFIED") throw new Error("Please verify your email before booking.");
        throw new Error(data.error || "Couldn't book this class");
      }

      // 2) Pay from wallet.
      const pay = await fetch("/api/payments/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: data.bookingId }),
      });
      const payData = await pay.json();
      if (!pay.ok) throw new Error(payData.error || "Payment failed");

      toast({ title: "Class booked", description: "It's in your upcoming classes." });
      onOpenChange(false);
      onBooked?.();
    } catch (err: unknown) {
      toast({ title: "Couldn't book", description: err instanceof Error ? err.message : "Try again", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{post.title || post.subject || "Book a class"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            with <span className="font-medium text-foreground">{teacher}</span>
            {post.subject ? ` · ${post.subject}` : ""}
          </p>

          {/* Slot selection */}
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-sm font-medium"><CalendarClock className="h-4 w-4 text-primary" /> Choose a time</p>
            {slots.length === 0 ? (
              <p className="rounded-xl border border-border/70 bg-muted/40 p-4 text-sm text-muted-foreground">No available times right now.</p>
            ) : (
              <div className="max-h-52 space-y-2 overflow-auto pr-1">
                {slots.map((s) => {
                  const active = s.id === slotId;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSlotId(s.id)}
                      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors ${active ? "border-primary bg-primary/[0.06]" : "border-border/70 hover:bg-muted/50"}`}
                    >
                      <span>
                        <span className="font-medium">{format(new Date(s.startTime), "EEE, MMM d")}</span>
                        <span className="text-muted-foreground"> · {format(new Date(s.startTime), "h:mm a")}–{format(new Date(s.endTime), "h:mm a")}</span>
                      </span>
                      {active && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Price + wallet */}
          <div className="space-y-1.5 rounded-2xl border border-border/70 bg-muted/30 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Price</span>
              <span className="font-semibold">{formatMoney(fee, currency)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-muted-foreground"><Wallet className="h-3.5 w-3.5" /> Wallet balance</span>
              <span className={insufficient ? "text-destructive" : ""}>{balance === null ? "…" : formatMoney(balance, currency)}</span>
            </div>
          </div>

          {/* Gates + action */}
          {!emailVerified ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-warning/40 bg-warning/[0.08] px-4 py-3 text-sm">
              <span className="flex items-center gap-2 text-foreground"><ShieldAlert className="h-4 w-4 text-warning" /> Verify your email to book.</span>
              <Button variant="warm" size="sm" asChild><Link href="/verify-email">Verify</Link></Button>
            </div>
          ) : insufficient ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm">
              <span className="text-muted-foreground">Top up {formatMoney(shortfall, currency)} to book this class.</span>
              <Button variant="hero" size="sm" asChild><Link href="/student/dashboard?tab=wallet">Top up wallet</Link></Button>
            </div>
          ) : (
            <Button variant="hero" className="w-full" disabled={busy || !slotId} onClick={book}>
              {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Booking…</> : <>Pay {formatMoney(fee, currency)} & book</>}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookClassModal;
