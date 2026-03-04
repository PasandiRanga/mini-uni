/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Video, RefreshCw, User, DollarSign, MapPin, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Booking {
  id: string;
  status: string;
  timeSlot?: { startTime?: string; endTime?: string };
  inquiry?: { post?: { title?: string; subject?: string } };
  teacher?: { firstName?: string; lastName?: string };
  student?: { firstName?: string; lastName?: string };
  googleMeetLink?: string | null;
  mode?: 'ONLINE' | string;
  fee?: number;
}

const MyClasses: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '');

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const url = user.role === 'STUDENT'
        ? `${baseUrl}/api/bookings/student/${user.id}/upcoming`
        : `${baseUrl}/api/bookings/teacher/${user.id}`;

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
  }, [user, baseUrl, toast]);

  useEffect(() => {
    fetchBookings();
    const iv = setInterval(fetchBookings, 15000); // refresh every 15s
    return () => clearInterval(iv);
  }, [fetchBookings]);

  const now = new Date();
  const upcoming = bookings.filter((b) => {
    const s = b.timeSlot?.startTime ? new Date(b.timeSlot.startTime) : null;
    return s ? s > now && b.status !== 'CANCELLED' : false;
  }).sort((a, b) => (new Date(a.timeSlot?.startTime || '').getTime() - new Date(b.timeSlot?.startTime || '').getTime()));

  const past = bookings.filter((b) => {
    const e = b.timeSlot?.endTime ? new Date(b.timeSlot.endTime) : null;
    return e ? e <= now || b.status === 'COMPLETED' || b.status === 'CANCELLED' : b.status === 'COMPLETED' || b.status === 'CANCELLED';
  }).sort((a, b) => (new Date(b.timeSlot?.startTime || '').getTime() - new Date(a.timeSlot?.startTime || '').getTime()));

  const handleJoin = (link?: string | null) => {
    if (!link) {
      toast({ title: 'No meeting link', description: 'This class does not have a meeting link', variant: 'default' });
      return;
    }
    window.open(link, '_blank');
  };

  const handleReschedule = (id: string) => {
    toast({ title: 'Reschedule', description: `Open reschedule flow for booking ${id}` });
    // TODO: implement reschedule flow
  };

  const getStatusClasses = (status: string) => {
    switch ((status || '').toUpperCase()) {
      case 'COMPLETED': return 'bg-success/10 text-success';
      case 'CANCELLED': return 'bg-destructive/10 text-destructive';
      case 'IN_PROGRESS': return 'bg-accent/10 text-accent';
      case 'CONFIRMED':
      case 'SCHEDULED':
        return 'bg-primary/10 text-primary';
      case 'PENDING':
      case 'AWAITING_CONFIRMATION':
        return 'bg-warning/10 text-warning';
      default:
        return 'bg-muted/10 text-muted-foreground';
    }
  };

  const renderBookingCard = (b: Booking) => {
    const start = b.timeSlot?.startTime ? new Date(b.timeSlot.startTime) : null;
    const end = b.timeSlot?.endTime ? new Date(b.timeSlot.endTime) : null;
    const duration = start && end ? `${Math.round(((end.getTime() - start.getTime()) / 60000))} mins` : '-';
    const otherName = user?.role === 'STUDENT' ? `${b.teacher?.firstName || ''} ${b.teacher?.lastName || ''}` : `${b.student?.firstName || ''} ${b.student?.lastName || ''}`;
    const statusClasses = getStatusClasses(b.status || '');
    const title = b.inquiry?.post?.title || b.inquiry?.post?.subject || 'Class';
    const grade = (b.inquiry?.post as any)?.grade || (b.inquiry?.post as any)?.level || null;

    return (
      <div key={b.id} className="p-4 bg-card rounded-2xl shadow-md border border-border mb-4">
        <div className="md:flex md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary font-semibold text-lg">
              {(otherName || 'U').split(' ').map(n => n.charAt(0)).slice(0, 2).join('')}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <div className="text-base font-semibold">{title}</div>
                {grade && <div className="text-xs text-muted-foreground px-2 py-1 rounded-md border border-border">{grade}</div>}
                <Badge className="ml-2">ONLINE</Badge>
              </div>
              <div className="text-sm text-muted-foreground mt-1">With <span className="font-medium text-foreground">{otherName || (user?.role === 'STUDENT' ? 'Teacher' : 'Student')}</span></div>
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4" />{start ? start.toLocaleDateString() : '-'}</div>
                <div className="flex items-center gap-2"><Clock className="w-4 h-4" />{start ? start.toLocaleTimeString() : '-'} • {duration}</div>
                {b.fee !== undefined && (
                  <div className="flex items-center gap-2"><DollarSign className="w-4 h-4" />${b.fee}</div>
                )}

              </div>
            </div>
          </div>

          <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end gap-3">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusClasses}`}>{b.status}</div>
            {start && start > new Date() ? (
              <div className="flex items-center gap-2">
                {b.googleMeetLink && (
                  <Button size="sm" variant="secondary" onClick={() => handleJoin(b.googleMeetLink)}>
                    <Video className="w-4 h-4 mr-2" />Join Class
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => handleReschedule(b.id)}>Reschedule</Button>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">{end ? `Duration: ${duration}` : ''}</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">My Classes</h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={fetchBookings}><RefreshCw className="w-4 h-4 mr-1" />Refresh</Button>
        </div>
      </div>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-lg">Upcoming Classes</h3>
          <div className="text-sm text-muted-foreground">{upcoming.length} scheduled</div>
        </div>
        {loading && <div className="text-sm text-muted-foreground">Loading...</div>}
        {!loading && upcoming.length === 0 && (
          <div className="p-8 bg-card rounded-2xl border border-border text-center">
            <Calendar className="mx-auto mb-4 w-12 h-12 text-muted-foreground" />
            <h4 className="text-lg font-semibold mb-2">You don’t have any upcoming classes yet</h4>
            <p className="text-sm text-muted-foreground mb-4">Once you book a class it will appear here — upcoming sessions are shown at a glance.</p>
            {user?.role === 'STUDENT' ? (
              <Link href="/feed">
                <Button variant="hero">Explore Classes</Button>
              </Link>
            ) : (
              <Link href="/post/create">
                <Button variant="hero">Create an Offering</Button>
              </Link>
            )}
          </div>
        )}
        {!loading && upcoming.length > 0 && (
          <div className="space-y-3">
            {upcoming.map(renderBookingCard)}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-lg">Past Classes</h3>
          <div className="text-sm text-muted-foreground">{past.length} total</div>
        </div>
        {!loading && past.length === 0 && (
          <div className="p-8 bg-card rounded-2xl border border-border text-center">
            <CheckCircle className="mx-auto mb-4 w-12 h-12 text-muted-foreground" />
            <h4 className="text-lg font-semibold mb-2">No past classes yet</h4>
            <p className="text-sm text-muted-foreground mb-4">Completed classes will appear here with confirmation status and durations.</p>
            {user?.role === 'STUDENT' ? (
              <Link href="/feed">
                <Button variant="hero">Explore Classes</Button>
              </Link>
            ) : (
              <Link href="/post/create">
                <Button variant="hero">Create an Offering</Button>
              </Link>
            )}
          </div>
        )}
        {!loading && past.length > 0 && (
          <div className="space-y-3">
            {past.map(renderBookingCard)}
          </div>
        )}
      </section>
    </div>
  );
};

export default MyClasses;
