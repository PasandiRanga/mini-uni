/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Video, User, CheckCircle, XCircle, ChevronRight, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatMoney } from '@/lib/currency';
import { slotDurationLabel } from '@/components/post/postCardBits';

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

type ViewId = 'upcoming' | 'completed' | 'cancelled';

const PREVIEW_COUNT = 3;

const VIEWS: {
  id: ViewId;
  label: string;
  statuses: string[];
  emptyIcon: typeof Calendar;
  emptyText: string;
}[] = [
  {
    id: 'upcoming',
    label: 'Upcoming',
    statuses: ['CONFIRMED', 'IN_PROGRESS'],
    emptyIcon: Calendar,
    emptyText: 'No upcoming classes yet. Confirmed classes appear here.',
  },
  {
    id: 'completed',
    label: 'Completed',
    statuses: ['COMPLETED'],
    emptyIcon: CheckCircle,
    emptyText: 'No completed classes yet. Finished classes appear here.',
  },
  {
    id: 'cancelled',
    label: 'Cancelled',
    statuses: ['CANCELLED'],
    emptyIcon: XCircle,
    emptyText: 'No cancelled classes.',
  },
];

interface MyClassesProps {
  /** Compact overview tile: upcoming only, no filters, capped at PREVIEW_COUNT. */
  preview?: boolean;
  /** "View all" handler for preview mode — usually switches the dashboard to the classes tab. */
  onViewAll?: () => void;
}

const MyClasses: React.FC<MyClassesProps> = ({ preview = false, onViewAll }) => {
  const { user } = useAuth();
  const currency = user?.currency;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<ViewId>('upcoming');
  const [showAll, setShowAll] = useState(false);
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

  const countFor = (statuses: string[]) =>
    bookings.filter((b) => statuses.includes((b.status || '').toUpperCase())).length;

  const activeView = preview ? VIEWS[0] : VIEWS.find((v) => v.id === view)!;

  // Upcoming reads soonest-first; finished and cancelled read most-recent-first.
  const items = bookings
    .filter((b) => activeView.statuses.includes((b.status || '').toUpperCase()))
    .sort((a, b) => (activeView.id === 'upcoming' ? startMs(a) - startMs(b) : startMs(b) - startMs(a)));

  const visible = showAll && !preview ? items : items.slice(0, PREVIEW_COUNT);

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
    const duration = b.timeSlot?.startTime && b.timeSlot?.endTime
      ? slotDurationLabel([{ startTime: b.timeSlot.startTime, endTime: b.timeSlot.endTime }])
      : null;
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
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{start ? start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'} · {duration || '—'}</span>
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

  const EmptyIcon = activeView.emptyIcon;

  return (
    <section className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-6 py-5">
        <h2 className="text-lg font-semibold">
          {preview ? 'Upcoming' : 'My'} <span className="font-serif font-normal">classes</span>
        </h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={fetchBookings} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          {preview && onViewAll && items.length > 0 && (
            <Button variant="ghost" size="sm" className="text-primary" onClick={onViewAll}>
              View all
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
          {!preview && items.length > PREVIEW_COUNT && (
            <Button variant="ghost" size="sm" className="text-primary" onClick={() => setShowAll((v) => !v)}>
              {showAll ? 'Show less' : 'View all'}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Status filters */}
      {!preview && (
        <div className="flex flex-wrap gap-1.5 border-b border-border/60 px-6 py-3">
          {VIEWS.map((v) => {
            const active = v.id === view;
            const count = countFor(v.statuses);
            return (
              <button
                key={v.id}
                onClick={() => { setView(v.id); setShowAll(false); }}
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${active
                  ? 'bg-primary text-primary-foreground shadow-soft'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                  }`}
              >
                {v.label}
                <span className={`rounded-full px-1.5 text-[11px] ${active ? 'bg-primary-foreground/20' : 'bg-muted'}`}>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="p-6">
        {loading && items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <div className="py-8 text-center">
            <EmptyIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">{activeView.emptyText}</p>
          </div>
        ) : (
          <div className="space-y-3">{visible.map(renderBookingCard)}</div>
        )}
      </div>
    </section>
  );
};

export default MyClasses;
