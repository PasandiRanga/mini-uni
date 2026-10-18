/**
 * Dispute settings shared by the server and the UI (no database imports, so
 * client components can use it).
 */

/** How long after a class ends the student can still report a problem. The teacher's payout waits this long. */
export const DISPUTE_WINDOW_HOURS = 48;
export const DISPUTE_WINDOW_MS = DISPUTE_WINDOW_HOURS * 60 * 60 * 1000;

export const DISPUTE_REASONS = {
  NO_SHOW: "The teacher didn't show up",
  ENDED_EARLY: "The class was much shorter than booked",
  QUALITY: "The class wasn't what was advertised",
  TECHNICAL: "Technical problems stopped the class",
  OTHER: "Something else",
} as const;

export type DisputeReason = keyof typeof DISPUTE_REASONS;

export const isDisputeReason = (v: unknown): v is DisputeReason =>
  typeof v === "string" && v in DISPUTE_REASONS;

/** Whether a student can still report a class: it has started and the window hasn't closed. */
export function withinDisputeWindow(startTime: string | Date, endTime: string | Date, now = Date.now()): boolean {
  return new Date(startTime).getTime() <= now && now <= new Date(endTime).getTime() + DISPUTE_WINDOW_MS;
}
