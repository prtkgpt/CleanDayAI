import { cn } from "@/lib/utils";
import {
  LEAD_STATUS_COLORS,
  LEAD_STATUS_LABELS,
  BOOKING_STATUS_COLORS,
  BOOKING_STATUS_LABELS,
} from "@/lib/constants";
import type { LeadStatus, BookingStatus } from "@prisma/client";

export function LeadStatusBadge({ status, className }: { status: LeadStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        LEAD_STATUS_COLORS[status],
        className
      )}
    >
      {LEAD_STATUS_LABELS[status]}
    </span>
  );
}

export function BookingStatusBadge({
  status,
  className,
}: {
  status: BookingStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        BOOKING_STATUS_COLORS[status],
        className
      )}
    >
      {BOOKING_STATUS_LABELS[status]}
    </span>
  );
}
