import { cn } from "@/lib/utils/cn";
import { requestStatusLabels } from "@/lib/utils/requests";
import type { RequestStatus } from "@/types/requests";

const toneMap: Record<RequestStatus, string> = {
  draft: "bg-muted text-foreground",
  pending: "bg-amber-100 text-amber-800",
  pending_supervisor: "bg-amber-100 text-amber-800",
  pending_rrhh: "bg-purple-100 text-purple-800",
  approved: "bg-emerald-100 text-emerald-700",
  observed: "bg-orange-100 text-orange-700",
  rejected: "bg-rose-100 text-rose-700",
  cancelled: "bg-slate-200 text-foreground",
  expired: "bg-red-100 text-red-800",
  resubmitted: "bg-sky-100 text-sky-700",
  unknown: "bg-muted text-muted-foreground",
};

export function RequestStatusBadge({ status, statusLabel }: { status: RequestStatus; statusLabel?: string }) {
  const label = statusLabel || requestStatusLabels[status] || status;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        toneMap[status] || toneMap.unknown,
      )}
    >
      {label}
    </span>
  );
}
