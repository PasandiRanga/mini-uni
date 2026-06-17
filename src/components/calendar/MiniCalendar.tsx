'use client';

import { useMemo, useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  format,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MiniCalendarProps {
  /** Anything with a `start` date — used to mark days that have classes. */
  events?: Array<{ start?: string | Date | null }>;
  /** Called when a day is clicked. */
  onSelectDate?: (date: Date) => void;
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

const MiniCalendar = ({ events = [], onSelectDate }: MiniCalendarProps) => {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const days = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [month]);

  const eventDates = useMemo(
    () => events.map((e) => (e.start ? new Date(e.start) : null)).filter(Boolean) as Date[],
    [events],
  );
  const hasEvent = (d: Date) => eventDates.some((ed) => isSameDay(ed, d));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold">{format(month, "MMMM yyyy")}</p>
        <div className="flex items-center gap-1">
          <button onClick={() => setMonth((m) => addMonths(m, -1))} className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => setMonth((m) => addMonths(m, 1))} className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-muted-foreground">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="py-1">{d}</div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((d) => {
          const inMonth = isSameMonth(d, month);
          const event = hasEvent(d);
          const today = isToday(d);
          return (
            <button
              key={d.toISOString()}
              onClick={() => onSelectDate?.(d)}
              className={`relative flex h-8 items-center justify-center rounded-lg text-xs transition-colors ${event
                ? "bg-primary font-medium text-primary-foreground"
                : today
                  ? "border border-accent/70 font-medium text-foreground"
                  : inMonth
                    ? "text-foreground hover:bg-muted/60"
                    : "text-muted-foreground/40 hover:bg-muted/40"
                }`}
            >
              {format(d, "d")}
              {event && !today && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary-foreground/80" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MiniCalendar;
