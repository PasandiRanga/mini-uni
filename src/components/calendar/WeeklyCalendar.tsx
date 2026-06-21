'use client';

import { useMemo } from "react";
import {
  startOfWeek,
  addDays,
  addWeeks,
  format,
  isSameDay,
  isToday,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status?: string;
  subtitle?: string;
}

interface WeeklyCalendarProps {
  weekStart: Date;
  onWeekChange: (d: Date) => void;
  events: CalendarEvent[];
  onSelectEvent?: (e: CalendarEvent) => void;
  /** First/last hour shown (24h). */
  dayStart?: number;
  dayEnd?: number;
  /** Pixel height of one hour row. */
  hourHeight?: number;
}

const DAYS_IN_WEEK = 7;

const statusStyles = (status?: string) => {
  switch ((status || "").toUpperCase()) {
    case "COMPLETED":
      return "bg-success/15 border-success/40 text-success";
    case "CANCELLED":
      return "bg-destructive/10 border-destructive/30 text-destructive line-through";
    case "IN_PROGRESS":
      return "bg-accent/15 border-accent/40 text-accent-foreground";
    default: // CONFIRMED & others
      return "bg-primary/15 border-primary/40 text-primary";
  }
};

const WeeklyCalendar = ({
  weekStart,
  onWeekChange,
  events,
  onSelectEvent,
  dayStart = 7,
  dayEnd = 22,
  hourHeight = 52,
}: WeeklyCalendarProps) => {
  const days = useMemo(
    () => Array.from({ length: DAYS_IN_WEEK }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );
  const hours = useMemo(
    () => Array.from({ length: dayEnd - dayStart }, (_, i) => dayStart + i),
    [dayStart, dayEnd],
  );
  const gridHeight = (dayEnd - dayStart) * hourHeight;

  const monthLabel = `${format(weekStart, "MMM d")} – ${format(addDays(weekStart, 6), "MMM d, yyyy")}`;

  const eventPosition = (e: CalendarEvent) => {
    const startHrs = e.start.getHours() + e.start.getMinutes() / 60;
    const endHrs = e.end.getHours() + e.end.getMinutes() / 60;
    const top = Math.max(0, (startHrs - dayStart) * hourHeight);
    const height = Math.max(22, (Math.min(endHrs, dayEnd) - startHrs) * hourHeight - 2);
    return { top, height };
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header — week navigation */}
      <div className="flex items-center justify-between gap-3 px-1 pb-4">
        <h3 className="text-base font-semibold sm:text-lg">{monthLabel}</h3>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-border/70" onClick={() => onWeekChange(addWeeks(weekStart, -1))} aria-label="Previous week">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="rounded-full border border-border/70" onClick={() => onWeekChange(startOfWeek(new Date(), { weekStartsOn: 0 }))}>
            Today
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-border/70" onClick={() => onWeekChange(addWeeks(weekStart, 1))} aria-label="Next week">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Horizontal + vertical scroll container — keeps columns legible on mobile */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-[600px]">
          {/* Day headers */}
          <div className="grid border-b border-border/60" style={{ gridTemplateColumns: `56px repeat(${DAYS_IN_WEEK}, 1fr)` }}>
            <div />
            {days.map((d) => (
              <div key={d.toISOString()} className="pb-2 text-center">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{format(d, "EEE")}</p>
                <p className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${isToday(d) ? "bg-primary text-primary-foreground" : "text-foreground"}`}>
                  {format(d, "d")}
                </p>
              </div>
            ))}
          </div>

          {/* Time grid */}
          <div className="grid" style={{ gridTemplateColumns: `56px repeat(${DAYS_IN_WEEK}, 1fr)` }}>
          {/* Hour labels */}
          <div className="relative" style={{ height: gridHeight }}>
            {hours.map((h, i) => (
              <div key={h} className="absolute right-2 -translate-y-1/2 text-[11px] text-muted-foreground" style={{ top: i * hourHeight }}>
                {format(new Date().setHours(h, 0, 0, 0), "h a")}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const dayEvents = events.filter((e) => isSameDay(e.start, day));
            return (
              <div key={day.toISOString()} className={`relative border-l border-border/50 ${isToday(day) ? "bg-primary/[0.03]" : ""}`} style={{ height: gridHeight }}>
                {/* Hour gridlines */}
                {hours.map((h, i) => (
                  <div key={h} className="absolute inset-x-0 border-t border-border/40" style={{ top: i * hourHeight }} />
                ))}

                {/* Events */}
                {dayEvents.map((e) => {
                  const { top, height } = eventPosition(e);
                  return (
                    <button
                      key={e.id}
                      onClick={() => onSelectEvent?.(e)}
                      className={`absolute inset-x-1 overflow-hidden rounded-lg border px-2 py-1 text-left text-[11px] leading-tight shadow-soft transition-transform hover:z-10 hover:scale-[1.02] ${statusStyles(e.status)}`}
                      style={{ top, height }}
                    >
                      <p className="truncate font-semibold">{e.title}</p>
                      <p className="truncate opacity-80">{format(e.start, "h:mm a")}{e.subtitle ? ` · ${e.subtitle}` : ""}</p>
                    </button>
                  );
                })}
              </div>
            );
          })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyCalendar;
