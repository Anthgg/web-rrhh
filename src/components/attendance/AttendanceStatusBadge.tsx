import { cn } from "@/lib/utils/cn";
import { getStatusColor, STATUS_LABELS } from "@/lib/utils/attendance";
import type { AttendanceDayStatus } from "@/types/schedule";

interface AttendanceStatusBadgeProps {
  status: AttendanceDayStatus;
  className?: string;
  label?: string;
}

export function AttendanceStatusBadge({ status, className, label }: AttendanceStatusBadgeProps) {
  const colors = getStatusColor(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        colors.bg,
        colors.text,
        colors.border,
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", colors.dot)} />
      {label || STATUS_LABELS[status]}
    </span>
  );
}
