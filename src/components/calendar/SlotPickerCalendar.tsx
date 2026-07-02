'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  startOfToday,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  addMonths,
  format,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export interface PickerSlot {
  start: Date;
  end: Date;
}
interface BusySlot {
  start: string | Date;
  end: string | Date;
  title?: string;
}

interface SlotPickerCalendarProps {
  selected: PickerSlot[];
  onChange: (slots: PickerSlot[]) => void;
  /** Already-booked ranges, rendered disabled. */
  busy?: BusySlot[];
  /** Class length in minutes (a click adds a slot of this length). */
  durationMin: number;
  /** Called when a drag defines a custom span — keeps the duration field in sync. */
  onDurationChange?: (min: number) => void;
  /** When true, only a single slot can be picked — a new selection replaces the old one. */
  single?: boolean;
  dayStart?: number;
  dayEnd?: number;
  hourHeight?: number;
}

const SNAP_MIN = 15; // snap selections to 15-minute increments
const GAP_MIN = 15; // required gap between slots
const LEAD_MIN = 15; // a slot must start at least this many minutes from now
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const overlaps = (aS: number, aE: number, bS: number, bE: number, gapMs: number) =>
  aS < bE + gapMs && bS < aE + gapMs;

// Earliest selectable start: now + the lead gap, rounded up to the next 15-min mark.
// e.g. at 8:00 the lead pushes to 8:15, then up to the next mark → 8:30 is the first selectable slot.
const earliestStartMs = () => {
  const snapMs = SNAP_MIN * 60000;
  const base = Date.now() + LEAD_MIN * 60000;
  return Math.floor(base / snapMs) * snapMs + snapMs;
};

// 15-minute time options ("HH:mm") for the styled time dropdowns.
const TIME_OPTIONS = Array.from({ length: 96 }, (_, i) => {
  const h = Math.floor(i / 4), m = (i % 4) * 15;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});
const label12 = (hm: string) => {
  const [h, m] = hm.split(":").map(Number);
  const hr = h % 12 || 12;
  return `${hr}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

/** A time input with a dropdown styled to match the rest of the form (type or pick). */
const TimeField = ({ value, onChange, ariaLabel }: { value: string; onChange: (v: string) => void; ariaLabel: string }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (open && listRef.current) {
      const el = listRef.current.querySelector('[data-active="true"]') as HTMLElement | null;
      if (el) el.scrollIntoView({ block: "center" });
    }
  }, [open]);

  const onBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!ref.current?.contains(e.relatedTarget as Node)) setOpen(false);
  };

  return (
    <div ref={ref} className="relative" onBlur={onBlur}>
      <input
        type="text"
        inputMode="numeric"
        role="combobox"
        aria-expanded={open}
        aria-label={ariaLabel}
        autoComplete="off"
        value={value}
        placeholder="--:--"
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        className="h-9 w-28 rounded-lg border border-input bg-card px-3 text-sm shadow-soft transition-all hover:border-foreground/25 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      />
      {open && (
        <ul ref={listRef} className="absolute z-50 mt-1.5 max-h-56 w-32 overflow-auto rounded-xl border border-input bg-card p-1 shadow-soft [scrollbar-color:hsl(var(--border))_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5">
          {TIME_OPTIONS.map((t) => (
            <li key={t}>
              <button
                type="button"
                data-active={t === value}
                onMouseDown={(e) => { e.preventDefault(); onChange(t); setOpen(false); }}
                className={`w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${t === value ? "bg-muted text-foreground" : "text-foreground/90 hover:bg-muted/60"}`}
              >
                {label12(t)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const SlotPickerCalendar = ({
  selected,
  onChange,
  busy = [],
  durationMin,
  onDurationChange,
  single = false,
  dayStart = 0,
  dayEnd = 24,
  hourHeight = 52,
}: SlotPickerCalendarProps) => {
  // Two-step flow: pick a date from the month grid, then pick a time on that date.
  const [pickedDay, setPickedDay] = useState<Date | null>(() => (selected[0] ? new Date(selected[0].start) : null));
  const [month, setMonth] = useState(() => startOfMonth(pickedDay ?? new Date()));
  const [drag, setDrag] = useState<{ startH: number; curH: number } | null>(null);
  const colRef = useRef<HTMLDivElement | null>(null);
  // Manual time-entry fields (an alternative to dragging on the grid).
  const [manualStart, setManualStart] = useState("");
  const [manualEnd, setManualEnd] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);

  const hours = useMemo(() => Array.from({ length: dayEnd - dayStart }, (_, i) => dayStart + i), [dayStart, dayEnd]);
  const gridHeight = (dayEnd - dayStart) * hourHeight;
  const busyParsed = useMemo(() => busy.map((b) => ({ start: new Date(b.start), end: new Date(b.end), title: b.title })), [busy]);

  const monthDays = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [month]);

  const today = startOfToday();
  const canGoPrevMonth = !isSameMonth(month, today) && !isBefore(month, today);

  // y position (px) → fractional hour, snapped to SNAP_MIN
  const yToHour = (y: number) => {
    const raw = dayStart + y / hourHeight;
    const snapped = Math.round((raw * 60) / SNAP_MIN) * SNAP_MIN / 60;
    return Math.min(Math.max(snapped, dayStart), dayEnd);
  };

  const hourToDate = (day: Date, h: number) => {
    const d = new Date(day);
    d.setHours(Math.floor(h), Math.round((h % 1) * 60), 0, 0);
    return d;
  };

  const conflicts = (start: Date, end: Date, ignoreSelected = false) => {
    const s = start.getTime();
    const e = end.getTime();
    const gapMs = GAP_MIN * 60000;
    if (busyParsed.some((b) => overlaps(s, e, b.start.getTime(), b.end.getTime(), gapMs))) return true;
    if (ignoreSelected) return false;
    return selected.some((sl) => overlaps(s, e, sl.start.getTime(), sl.end.getTime(), gapMs));
  };

  const addSlot = (start: Date, end: Date) => {
    if (start.getTime() < earliestStartMs()) return; // no past / too-soon slots (needs LEAD_MIN gap)
    // In single mode a new pick replaces the old one, so existing selection is not a conflict.
    if (conflicts(start, end, single)) return;
    if (single) { onChange([{ start, end }]); return; }
    onChange([...selected, { start, end }].sort((a, b) => a.start.getTime() - b.start.getTime()));
  };

  const removeSlot = (idx: number) => onChange(selected.filter((_, i) => i !== idx));

  // Build a Date on the picked day from an "HH:mm" string.
  const timeToDate = (hm: string) => {
    const [h, m] = hm.split(":").map(Number);
    const d = new Date(pickedDay as Date);
    d.setHours(h, m, 0, 0);
    return d;
  };

  // Validate a start/end pair and apply it as the slot (no button — runs on change).
  const applyManual = (s: string, e: string) => {
    if (!pickedDay) return;
    if (!/^\d{1,2}:\d{2}$/.test(s) || !/^\d{1,2}:\d{2}$/.test(e)) return; // incomplete typing — wait
    const start = timeToDate(s);
    const end = timeToDate(e);
    if (end.getTime() <= start.getTime()) { setManualError("End time must be after the start time."); return; }
    if (start.getTime() < earliestStartMs()) { setManualError("Pick a time at least 15 minutes from now."); return; }
    if (conflicts(start, end, single)) { setManualError("That time overlaps a booked slot."); return; }
    setManualError(null);
    addSlot(start, end);
    onDurationChange?.(Math.round((end.getTime() - start.getTime()) / 60000));
  };

  const onStartChange = (v: string) => { setManualStart(v); setManualError(null); applyManual(v, manualEnd); };
  const onEndChange = (v: string) => { setManualEnd(v); setManualError(null); applyManual(manualStart, v); };

  // When a date is picked, seed the inputs with a sensible default and apply it so the
  // chosen date immediately has a slot (which the teacher can then adjust).
  useEffect(() => {
    if (!pickedDay) return;
    const existing = selected.find((s) => isSameDay(s.start, pickedDay));
    if (existing) {
      setManualStart(format(existing.start, "HH:mm"));
      setManualEnd(format(existing.end, "HH:mm"));
      setManualError(null);
      return;
    }
    const earliest = new Date(earliestStartMs());
    const startD = isSameDay(earliest, pickedDay)
      ? earliest
      : (() => { const d = new Date(pickedDay); d.setHours(Math.max(dayStart, 9), 0, 0, 0); return d; })();
    const endD = new Date(startD.getTime() + durationMin * 60000);
    setManualStart(format(startD, "HH:mm"));
    setManualEnd(format(endD, "HH:mm"));
    setManualError(null);
    addSlot(startD, endD);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickedDay]);

  // On edit, the selection is filled in asynchronously after mount — open the slot's day
  // once it arrives (but never fight the user once they've navigated the calendar).
  const initedFromSelected = useRef(false);
  useEffect(() => {
    if (initedFromSelected.current) return;
    if (pickedDay) { initedFromSelected.current = true; return; }
    if (selected.length > 0) {
      setPickedDay(new Date(selected[0].start));
      initedFromSelected.current = true;
    }
  }, [selected, pickedDay]);

  // Keep the start/end inputs in sync when the slot changes on the grid (click or drag).
  useEffect(() => {
    if (!pickedDay) return;
    const existing = selected.find((s) => isSameDay(s.start, pickedDay));
    if (!existing) return;
    const s = format(existing.start, "HH:mm");
    const e = format(existing.end, "HH:mm");
    setManualStart((prev) => (prev === s ? prev : s));
    setManualEnd((prev) => (prev === e ? prev : e));
    setManualError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, pickedDay]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("[data-slot]")) return; // clicking a slot handles its own removal
    const rect = colRef.current?.getBoundingClientRect();
    if (!rect) return;
    const h = yToHour(e.clientY - rect.top);
    setDrag({ startH: h, curH: h });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    const rect = colRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDrag({ ...drag, curH: yToHour(e.clientY - rect.top) });
  };

  const onPointerUp = () => {
    if (!drag || !pickedDay) { setDrag(null); return; }
    const lo = Math.min(drag.startH, drag.curH);
    const hi = Math.max(drag.startH, drag.curH);
    const spanMin = (hi - lo) * 60;

    if (spanMin >= SNAP_MIN) {
      // Drag defined a custom span → use it and sync the duration field.
      addSlot(hourToDate(pickedDay, lo), hourToDate(pickedDay, hi));
      onDurationChange?.(Math.round(spanMin));
    } else {
      // A click → add a slot of the current duration starting here.
      const start = hourToDate(pickedDay, lo);
      const end = new Date(start.getTime() + durationMin * 60000);
      addSlot(start, end);
    }
    setDrag(null);
  };

  const slotBox = (start: Date, end: Date) => {
    const top = (start.getHours() + start.getMinutes() / 60 - dayStart) * hourHeight;
    const height = Math.max(20, ((end.getTime() - start.getTime()) / 3600000) * hourHeight - 2);
    return { top, height };
  };

  // ── Month view ─────────────────────────────────────────────────────────────
  if (!pickedDay) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
          <h4 className="text-sm font-semibold">{format(month, "MMMM yyyy")}</h4>
          <div className="flex items-center gap-1.5">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-border/70 disabled:opacity-40" onClick={() => setMonth((m) => addMonths(m, -1))} disabled={!canGoPrevMonth} aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></Button>
            <Button type="button" variant="ghost" size="sm" className="rounded-full border border-border/70" onClick={() => setMonth(startOfMonth(new Date()))}>Today</Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-border/70" onClick={() => setMonth((m) => addMonths(m, 1))} aria-label="Next month"><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground">
            {WEEKDAYS.map((d) => <div key={d} className="py-1">{d}</div>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {monthDays.map((d) => {
              const inMonth = isSameMonth(d, month);
              const past = isBefore(d, today);
              const isPicked = selected.some((s) => isSameDay(s.start, d));
              const td = isToday(d);
              if (past) {
                return (
                  <div
                    key={d.toISOString()}
                    aria-disabled
                    className="flex h-10 cursor-not-allowed items-center justify-center rounded-lg bg-muted/30 text-sm text-muted-foreground/35"
                  >
                    {format(d, "d")}
                  </div>
                );
              }
              return (
                <button
                  type="button"
                  key={d.toISOString()}
                  onClick={() => { setPickedDay(d); setDrag(null); }}
                  className={`flex h-10 items-center justify-center rounded-lg text-sm transition-colors ${isPicked
                    ? "bg-primary font-medium text-primary-foreground"
                    : td
                      ? "border border-primary/60 font-medium text-foreground hover:bg-muted/60"
                      : inMonth
                        ? "text-foreground hover:bg-muted/60"
                        : "text-muted-foreground/45 hover:bg-muted/40"}`}
                >
                  {format(d, "d")}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Time-slot view (for the picked day) ──────────────────────────────────────
  const daySelected = selected.map((s, i) => ({ s, i })).filter(({ s }) => isSameDay(s.start, pickedDay));
  const dayBusy = busyParsed.filter((b) => isSameDay(b.start, pickedDay));
  // Times before this are in the past / too soon to book — shown disabled.
  const earliestMs = earliestStartMs();
  const hourMs = (h: number) => { const d = new Date(pickedDay); d.setHours(h, 0, 0, 0); return d.getTime(); };

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-border/70" onClick={() => setPickedDay(null)} aria-label="Back to calendar"><ChevronLeft className="h-4 w-4" /></Button>
          <h4 className="text-sm font-semibold">{format(pickedDay, "EEEE, MMM d")}</h4>
        </div>
        <Button type="button" variant="ghost" size="sm" className="rounded-full border border-border/70" onClick={() => setPickedDay(null)}>Change date</Button>
      </div>

      {/* Manual time entry — alternative to dragging on the grid */}
      <div className="border-b border-border/60 px-4 py-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <span className="block text-[11px] font-medium text-muted-foreground">Start time</span>
            <TimeField value={manualStart} onChange={onStartChange} ariaLabel="Start time" />
          </div>
          <div className="space-y-1">
            <span className="block text-[11px] font-medium text-muted-foreground">End time</span>
            <TimeField value={manualEnd} onChange={onEndChange} ariaLabel="End time" />
          </div>
        </div>
        {manualError
          ? <p className="mt-2 text-[11px] text-destructive">{manualError}</p>
          : <p className="mt-2 text-[11px] text-muted-foreground">Pick a start and end time, or drag on the calendar below.</p>}
      </div>

      <div className="max-h-[460px] overflow-auto p-3 [scrollbar-color:hsl(var(--border))_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2">
        <div className="grid" style={{ gridTemplateColumns: `52px 1fr` }}>
          {/* Hour labels */}
          <div className="relative" style={{ height: gridHeight }}>
            {hours.map((h, i) => {
              const disabled = hourMs(h) < earliestMs;
              return (
                <div key={h} className={`absolute right-2 -translate-y-1/2 text-[10px] ${disabled ? "text-muted-foreground/35 line-through" : "text-muted-foreground"}`} style={{ top: i * hourHeight }}>
                  {format(new Date().setHours(h, 0, 0, 0), "h a")}
                </div>
              );
            })}
          </div>

          {/* Day column */}
          <div
            ref={colRef}
            className={`relative cursor-pointer touch-none border-l border-border/50 ${isToday(pickedDay) ? "bg-primary/[0.03]" : ""}`}
            style={{ height: gridHeight }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            {hours.map((h, i) => (
              <div key={h} className="pointer-events-none absolute inset-x-0 border-t border-border/40" style={{ top: i * hourHeight }} />
            ))}

            {/* Past / too-soon band (disabled) — times before the earliest selectable slot today */}
            {(() => {
              const minMs = earliestStartMs();
              const ds = new Date(pickedDay); ds.setHours(dayStart, 0, 0, 0);
              const dayStartMs = ds.getTime();
              const disabledH = Math.max(0, Math.min(gridHeight, ((minMs - dayStartMs) / 3600000) * hourHeight));
              if (disabledH <= 0) return null;
              return (
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 z-[1] border-b border-border/50 bg-muted/55 [background-image:repeating-linear-gradient(45deg,transparent,transparent_6px,hsl(var(--muted-foreground)/0.06)_6px,hsl(var(--muted-foreground)/0.06)_12px)]"
                  style={{ height: disabledH }}
                />
              );
            })()}

            {/* Busy (disabled) */}
            {dayBusy.map((b, i) => {
              const { top, height } = slotBox(b.start, b.end);
              return (
                <div key={`b${i}`} className="absolute inset-x-1 cursor-not-allowed overflow-hidden rounded-md border border-muted-foreground/30 bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground" style={{ top, height }}>
                  <p className="truncate font-medium">Booked</p>
                </div>
              );
            })}

            {/* Selected availability */}
            {daySelected.map(({ s, i }) => {
              const { top, height } = slotBox(s.start, s.end);
              return (
                <div key={`s${i}`} data-slot className="group absolute inset-x-1 overflow-hidden rounded-md border border-primary/50 bg-primary/20 px-1.5 py-0.5 text-[10px] text-primary" style={{ top, height }}>
                  <div className="flex items-start justify-between">
                    <span className="font-medium">{format(s.start, "h:mm")}–{format(s.end, "h:mm a")}</span>
                    <button type="button" onClick={() => removeSlot(i)} className="rounded-full p-0.5 hover:bg-primary/20" aria-label="Remove slot">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Live drag preview */}
            {drag && (() => {
              const lo = Math.min(drag.startH, drag.curH);
              const hi = Math.max(drag.startH, drag.curH);
              const top = (lo - dayStart) * hourHeight;
              const height = Math.max(4, (hi - lo) * hourHeight);
              return <div className="pointer-events-none absolute inset-x-1 rounded-md border border-primary bg-primary/10" style={{ top, height }} />;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlotPickerCalendar;
