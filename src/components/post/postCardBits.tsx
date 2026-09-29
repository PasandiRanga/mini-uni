'use client';

import { useEffect, useRef, useState } from 'react';

export const CLASS_TYPE_LABELS: Record<string, string> = { INDIVIDUAL: 'Individual', GROUP: 'Group', MASS: 'Mass' };

type Slot = { startTime: string; endTime: string };

// Slots that have not finished yet, soonest first.
const upcomingSlots = (slots?: Slot[]) => {
  const now = Date.now();
  return (slots || [])
    .filter((s) => new Date(s.endTime).getTime() > now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
};

// A post is expired once it had slots and every one of them has passed.
// Posts that carry no slots at all (e.g. student requests) never expire.
export const isPostExpired = (slots?: Slot[]) =>
  Boolean(slots && slots.length > 0 && upcomingSlots(slots).length === 0);

// The slot a card should describe: the next one still to come, else the first.
const displaySlot = (slots?: Slot[]) => upcomingSlots(slots)[0] || slots?.[0] || null;

const slotDurationMin = (slots?: Slot[]) => {
  const s = displaySlot(slots);
  if (!s) return null;
  return Math.round((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 60000);
};

// Duration of the displayed time slot as "3h 30m" / "2h" / "45m".
export const slotDurationLabel = (slots?: Slot[]) => {
  const min = slotDurationMin(slots);
  if (min == null) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
};

// Date/time label for the displayed slot, e.g. "Jul 8, 10:00 AM (+1 more)".
// The "+N more" counts only other slots still to come.
export const slotDateLabel = (slots?: Slot[]) => {
  const s = displaySlot(slots);
  if (!s) return null;
  const label = new Date(s.startTime).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
  const more = Math.max(upcomingSlots(slots).length - 1, 0);
  return more > 0 ? `${label} (+${more} more)` : label;
};

// Description with a "See more" toggle when it overflows two lines.
export const PostDescription: React.FC<{ text: string }> = ({ text }) => {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (el) setOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [text]);

  return (
    <div>
      <p ref={ref} className={`text-sm leading-relaxed text-muted-foreground ${expanded ? '' : 'line-clamp-2'}`}>{text}</p>
      {(overflows || expanded) && (
        <button type="button" onClick={() => setExpanded((e) => !e)} className="mt-1 text-xs font-medium text-primary hover:underline">
          {expanded ? 'See less' : 'See more'}
        </button>
      )}
    </div>
  );
};
