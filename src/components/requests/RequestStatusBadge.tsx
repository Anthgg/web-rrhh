import { cn } from "@/lib/utils/cn";
import { requestStatusLabels } from "@/lib/utils/requests";
import type { RequestStatus } from "@/types/requests";

const toneMap: Record<RequestStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-700",
  observed: "bg-orange-100 text-orange-700",
  rejected: "bg-rose-100 text-rose-700",
  cancelled: "bg-slate-200 text-slate-700",
  resubmitted: "bg-sky-100 text-sky-700",
  unknown: "bg-slate-100 text-slate-500",
};

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        toneMap[status],
      )}
    >
      {requestStatusLabels[status]}
    </span>
  );
}
