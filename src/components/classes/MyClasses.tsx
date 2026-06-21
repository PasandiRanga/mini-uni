/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Video, User, CheckCircle, ChevronRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatMoney } from '@/lib/currency';

interface Booking {
  id: string;
  status: string;
  timeSlot?: { startTime?: string; endTime?: string };
  inquiry?: { post?: { title?: string; subject?: string } };
  teacher?: { firstName?: string; lastName?: string };
  student?: { firstName?: string; lastName?: string };
  googleMeetLink?: string | null;
  fee?: number;
}

const PREVIEW_COUNT = 3;
const UPCOMING_STATUSES = ['CONFIRMED', 'IN_PROGRESS'];
const PAST_STATUSES = ['COMPLETED', 'CANCELLED'];

const MyClasses: React.FC = () => {
  const { user } = useAuth();
  const currency = user?.currency;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [showAllPast, setShowAllPast] = useState(false);
  const { toast } = useToast();

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const url = user.role === 'STUDENT'
        ? `/api/bookings/student/${user.id}/upcoming`
        : `/api/bookings/teacher/${user.id}`;

      const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error('Failed to load classes');
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch bookings', err);
      toast({ title: 'Error', description: err?.message || 'Failed to load classes', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchBookings();
    const iv = setInterval(fetchBookings, 15000); // refresh every 15s
    return () => clearInterval(iv);
  }, [fetchBookings]);

  const startMs = (b: Booking) => new Date(b.timeSlot?.startTime || 0).getTime();

  // Upcoming: only active classes, soonest first.
  const upcoming = bookings
    .filter((b) => UPCOMING_STATUSES.includes((b.status || '').toUpperCase()))
    .sort((a, b) => startMs(a) - startMs(b));

  // Past: finished or cancelled, most recent first.
  const past = bookings
    .filter((b) => PAST_STATUSES.includes((b.status || '').toUpperCase()))
    .sort((a, b) => startMs(b) - startMs(a));

  const handleJoin = (link?: string | null) => {
    if (!link) {
      toast({ title: 'No meeting link', description: 'This class does not have a meeting link yet' });
      return;
    }
    window.open(link, '_blank');
  };

  const statusClasses = (status: string) => {
    switch ((status || '').toUpperCase()) {
      case 'COMPLETED': return 'bg-success/10 text-success';
      case 'CANCELLED': return 'bg-destructive/10 text-destructive';
      case 'IN_PROGRESS': return 'bg-accent/10 text-accent';
      case 'CONFIRMED': return 'bg-primary/10 text-primary';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const renderBookingCard = (b: Booking) => {
    const start = b.timeSlot?.startTime ? new Date(b.timeSlot.startTime) : null;
    const end = b.timeSlot?.endTime ? new Date(b.timeSlot.endTime) : null;
    const duration = start && end ? `${Math.round((end.getTime() - start.getTime()) / 60000)} min` : '—';
    const otherName = user?.role === 'STUDENT'
      ? `${b.teacher?.firstName || ''} ${b.teacher?.lastName || ''}`.trim()
      : `${b.student?.firstName || ''} ${b.student?.lastName || ''}`.trim();
    const title = b.inquiry?.post?.title || b.inquiry?.post?.subject || 'Class';
    const initials = (otherName || 'U').split(' ').map((n) => n.charAt(0)).slice(0, 2).join('');
    const isFuture = start ? start > new Date() : false;

    return (
      <div key={b.id} className="rounded-2xl border border-border/70 bg-background/40 p-4 transition-colors hover:bg-muted/40">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl gradient-hero text-sm font-semibold text-primary-foreground">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium">{title}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" /> {otherName || (user?.role === 'STUDENT' ? 'Teacher' : 'Student')}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{start ? start.toLocaleDateString() : '—'}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{start ? start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'} · {duration}</span>
                {b.fee !== undefined && b.fee !== null && <span className="font-medium text-foreground">{formatMoney(b.fee, currency)}</span>}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusClasses(b.status)}`}>{b.status}</span>
            {isFuture && b.googleMeetLink && (
              <Button size="sm" variant="hero" className="h-8" onClick={() => handleJoin(b.googleMeetLink)}>
                <Video className="h-3.5 w-3.5" /> Join
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const TileContainer = ({
    title,
    accent,
    items,
    showAll,
    onToggle,
    emptyIcon: EmptyIcon,
    emptyText,
  }: {
    title: string;
    accent: string;
    items: Booking[];
    showAll: boolean;
    onToggle: () => void;
    emptyIcon: typeof Calendar;
    emptyText: string;
  }) => {
    const visible = showAll ? items : items.slice(0, PREVIEW_COUNT);
    return (
      <section className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft">
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-5">
          <h2 className="text-lg font-semibold">
            {title} <span className="font-serif font-normal">{accent}</span>
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={fetchBookings} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            {items.length > PREVIEW_COUNT && (
              <Button variant="ghost" size="sm" className="text-primary" onClick={onToggle}>
                {showAll ? 'Show less' : 'View all'}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="p-6">
          {loading && items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : items.length === 0 ? (
            <div className="py-8 text-center">
              <EmptyIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground">{emptyText}</p>
            </div>
          ) : (
            <div className="space-y-3">{visible.map(renderBookingCard)}</div>
          )}
        </div>
      </section>
    );
  };

  return (
    <div className="space-y-6">
      <TileContainer
        title="Upcoming"
        accent="classes"
        items={upcoming}
        showAll={showAllUpcoming}
        onToggle={() => setShowAllUpcoming((v) => !v)}
        emptyIcon={Calendar}
        emptyText="No upcoming classes yet. Confirmed classes appear here."
      />
      <TileContainer
        title="Past"
        accent="classes"
        items={past}
        showAll={showAllPast}
        onToggle={() => setShowAllPast((v) => !v)}
        emptyIcon={CheckCircle}
        emptyText="No past classes yet. Completed and cancelled classes appear here."
      />
    </div>
  );
};

export default MyClasses;
