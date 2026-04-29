import type { LeadStatus, BookingStatus } from "@prisma/client";

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "New",
  AI_CONTACTED: "AI Contacted",
  QUALIFYING: "Qualifying",
  QUOTED: "Quoted",
  BOOKED: "Booked",
  LOST: "Lost",
  NEEDS_HUMAN: "Needs Human",
};

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  NEW: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  AI_CONTACTED: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  QUALIFYING: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  QUOTED: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  BOOKED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  LOST: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  NEEDS_HUMAN: "bg-red-500/15 text-red-400 border-red-500/30",
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  SCHEDULED: "Scheduled",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELED: "Canceled",
};

export const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  SCHEDULED: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  CONFIRMED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  COMPLETED: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  CANCELED: "bg-red-500/15 text-red-400 border-red-500/30",
};

export const LEAD_STATUSES: LeadStatus[] = [
  "NEW",
  "AI_CONTACTED",
  "QUALIFYING",
  "QUOTED",
  "BOOKED",
  "LOST",
  "NEEDS_HUMAN",
];

export const BOOKING_STATUSES: BookingStatus[] = [
  "SCHEDULED",
  "CONFIRMED",
  "COMPLETED",
  "CANCELED",
];
