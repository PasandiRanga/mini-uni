'use client';

import { useEffect, useMemo, useState } from "react";
import { startOfWeek } from "date-fns";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { formatMoney } from "@/lib/currency";
import WeeklyCalendar, { type CalendarEvent } from "@/components/calendar/WeeklyCalendar";
import { Maximize2, Minimize2, Calendar as CalendarIcon, Clock, User, Video, RefreshCw } from "lucide-react";

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

/** Bookings that represent real calendar entries. */
const SHOWN = ["CONFIRMED", "IN_PROGRESS", "COMPLETED"];

const ScheduleCalendar = () => {
  const { user } = useAuth();
  const currency = user?.currency;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [fullscreen, setFullscreen] = useState(false);
  const [selected, setSelected] = useState<(CalendarEvent & { meet?: string | null; fee?: number }) | null>(null);

  const fetchBookings = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const url = user.role === "STUDENT"
        ? `/api/bookings/student/${user.id}/upcoming`
        : `/api/bookings/teacher/${user.id}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setBookings(Array.isArray(data) ? data : []);
      }
    } catch {
      /* surfaced elsewhere */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const events = useMemo<(CalendarEvent & { meet?: string | null; fee?: number })[]>(() => {
    return bookings
      .filter((b) => SHOWN.includes((b.status || "").toUpperCase()) && b.timeSlot?.startTime && b.timeSlot?.endTime)
      .map((b) => {
        const other = user?.role === "STUDENT"
          ? `${b.teacher?.firstName || ""} ${b.teacher?.lastName || ""}`.trim()
          : `${b.student?.firstName || ""} ${b.student?.lastName || ""}`.trim();
        return {
          id: b.id,
          title: b.inquiry?.post?.title || b.inquiry?.post?.subject || "Class",
          start: new Date(b.timeSlot!.startTime!),
          end: new Date(b.timeSlot!.endTime!),
          status: b.status,
          subtitle: other || undefined,
          meet: b.googleMeetLink,
          fee: b.fee,
        };
      });
  }, [bookings, user?.role]);

  const calendar = (
    <WeeklyCalendar
      weekStart={weekStart}
      onWeekChange={setWeekStart}
      events={events}
      onSelectEvent={(e) => setSelected(e as CalendarEvent & { meet?: string | null; fee?: number })}
    />
  );

  return (
    <>
      <section className="flex flex-col overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft">
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-5">
          <h2 className="text-lg font-semibold">
            Your <span className="font-serif font-normal">schedule</span>
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={fetchBookings} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-primary" onClick={() => setFullscreen(true)}>
              <Maximize2 className="h-4 w-4" />
              <span className="hidden sm:inline">Expand</span>
            </Button>
          </div>
        </div>
        <div className="h-[520px] p-4 sm:p-6">{calendar}</div>
      </section>

      {/* Fullscreen weekly grid */}
      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="h-[92vh] max-w-[96vw] gap-0 p-0 sm:max-w-[96vw]">
          <DialogHeader className="flex flex-row items-center justify-between border-b border-border/60 px-6 py-4">
            <DialogTitle>Schedule</DialogTitle>
            <Button variant="ghost" size="sm" className="mr-8 text-muted-foreground" onClick={() => setFullscreen(false)}>
              <Minimize2 className="h-4 w-4" /> Close
            </Button>
          </DialogHeader>
          <div className="h-[calc(92vh-64px)] p-4 sm:p-6">{calendar}</div>
        </DialogContent>
      </Dialog>

      {/* Event details */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <p className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" /> {selected.subtitle || (user?.role === "STUDENT" ? "Teacher" : "Student")}
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <CalendarIcon className="h-4 w-4" /> {format(selected.start, "EEEE, MMM d")}
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" /> {format(selected.start, "h:mm a")} – {format(selected.end, "h:mm a")}
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{selected.status}</span>
                  {selected.fee != null && <span className="font-medium">{formatMoney(selected.fee, currency)}</span>}
                </div>
                {selected.meet && (
                  <Button variant="hero" className="w-full" onClick={() => window.open(selected.meet!, "_blank")}>
                    <Video className="h-4 w-4" /> Join class
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ScheduleCalendar;
