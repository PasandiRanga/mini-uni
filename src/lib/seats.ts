import { ClassType, Prisma, type Post } from "@prisma/client";

/**
 * Seats on a time slot
 * --------------------
 * A teacher's slot can be booked one of two ways, and the first booking
 * decides which (`TimeSlot.bookedAs`):
 *
 * - INDIVIDUAL takes the whole slot. Nobody else can join it.
 * - GROUP lets several students share it, one booking each, up to the post's
 *   `maxStudents`.
 *
 * `TimeSlot.status` stays AVAILABLE while the slot can still take a booking
 * and turns BOOKED once it can't (an individual booking, or a full group).
 * Cancelling a booking frees its seat again.
 */

/** Booking statuses that hold a seat. Cancelled bookings give theirs back. */
const ACTIVE_BOOKING: Prisma.BookingWhereInput = { status: { not: "CANCELLED" } };

/** The class types a student can choose between on this post. */
export function bookableClassTypes(post: Pick<Post, "classTypes">): ClassType[] {
  const offered = (post.classTypes || []).filter((t) => t === "INDIVIDUAL" || t === "GROUP");
  return offered.length > 0 ? offered : ["INDIVIDUAL"];
}

/** Per-student price for one class of the chosen type. */
export function feeFor(post: Pick<Post, "fee" | "groupFee">, classType: ClassType) {
  const fee = classType === "GROUP" ? post.groupFee ?? post.fee : post.fee;
  return new Prisma.Decimal(fee ?? 0);
}

/** Seats a GROUP slot holds. A group with no cap set still needs room for more than one. */
export const groupCapacity = (post: Pick<Post, "maxStudents">) => Math.max(post.maxStudents ?? 0, 2);

export class SeatError extends Error {
  constructor(code: "SLOT_TAKEN" | "SLOT_FULL" | "WRONG_TYPE" | "ALREADY_BOOKED") {
    super(code);
  }
}

/**
 * Claims a seat on a slot for this student, inside the caller's transaction.
 * Locks the slot row first, so two students racing for the last seat can't both
 * get it. Throws a SeatError when the slot can't take this booking.
 */
export async function claimSeat(
  tx: Prisma.TransactionClient,
  args: { slotId: string; studentId: string; classType: ClassType; post: Pick<Post, "maxStudents"> }
) {
  const { slotId, studentId, classType, post } = args;

  await tx.$queryRaw`SELECT id FROM "time_slots" WHERE id = ${slotId} FOR UPDATE`;

  const slot = await tx.timeSlot.findUniqueOrThrow({ where: { id: slotId } });
  const active = await tx.booking.findMany({
    where: { timeSlotId: slotId, ...ACTIVE_BOOKING },
    select: { studentId: true },
  });

  if (active.some((b) => b.studentId === studentId)) throw new SeatError("ALREADY_BOOKED");

  // With no active bookings the slot is open to either type, whatever it was before.
  const lockedAs = active.length > 0 ? slot.bookedAs : null;

  if (classType === "INDIVIDUAL") {
    if (active.length > 0) throw new SeatError("SLOT_TAKEN");
    await tx.timeSlot.update({ where: { id: slotId }, data: { status: "BOOKED", bookedAs: "INDIVIDUAL" } });
    return;
  }

  if (lockedAs && lockedAs !== "GROUP") throw new SeatError("WRONG_TYPE");
  const capacity = groupCapacity(post);
  if (active.length >= capacity) throw new SeatError("SLOT_FULL");

  const full = active.length + 1 >= capacity;
  await tx.timeSlot.update({
    where: { id: slotId },
    data: { status: full ? "BOOKED" : "AVAILABLE", bookedAs: "GROUP" },
  });
}

/**
 * Gives a cancelled booking's seat back. Call after the booking is marked
 * CANCELLED. Once a slot has no active bookings left it is open to either
 * type again.
 */
export async function releaseSeat(tx: Prisma.TransactionClient, slotId: string) {
  await tx.$queryRaw`SELECT id FROM "time_slots" WHERE id = ${slotId} FOR UPDATE`;

  const remaining = await tx.booking.count({ where: { timeSlotId: slotId, ...ACTIVE_BOOKING } });
  if (remaining === 0) {
    await tx.timeSlot.update({ where: { id: slotId }, data: { status: "AVAILABLE", bookedAs: null } });
    return;
  }

  const slot = await tx.timeSlot.findUniqueOrThrow({ where: { id: slotId } });
  // A group with a free seat can take bookings again; an individual slot stays taken.
  if (slot.bookedAs === "GROUP") {
    await tx.timeSlot.update({ where: { id: slotId }, data: { status: "AVAILABLE" } });
  }
}

/** Prisma include for a post's slots with how many seats each has taken. */
export const slotsWithSeats = {
  include: { _count: { select: { bookings: { where: ACTIVE_BOOKING } } } },
} satisfies Prisma.Post$timeSlotsArgs;

/** User-facing message for a SeatError. */
export const seatErrorMessage = (code: string) =>
  ({
    SLOT_TAKEN: "That time slot was just booked by someone else",
    SLOT_FULL: "That group class is full",
    WRONG_TYPE: "That time slot is already booked as a one-to-one class",
    ALREADY_BOOKED: "You've already booked this time slot",
  })[code] ?? "That time slot is no longer available";
