import { cn } from "@/lib/utils/cn";
import { formatStatusLabel } from "@/lib/utils/format";
import type { DocumentStatus, RequestStatus, WorkerStatus } from "@/types";

const toneMap: Record<string, string> = {
 pending: "bg-primary-soft text-primary",
 approved: "bg-emerald-100 text-emerald-700",
 observed: "bg-amber-100 text-amber-700",
 rejected: "bg-rose-100 text-rose-700",
 cancelled: "bg-slate-200 text-foreground",
 draft: "bg-muted text-muted-foreground",
 available: "bg-emerald-100 text-emerald-700",
 missing: "bg-rose-100 text-rose-700",
 expired: "bg-amber-100 text-amber-700",
 active: "bg-primary-soft text-primary",
 inactive: "bg-slate-200 text-foreground",
 "on-leave": "bg-amber-100 text-amber-700",
 unknown: "bg-muted text-muted-foreground",
};

export function StatusBadge({
 status,
}: {
 status: RequestStatus | DocumentStatus | WorkerStatus;
}) {
 return (
 <span
 className={cn(
 "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
 toneMap[status],
 )}
 >
 {formatStatusLabel(status)}
 </span>
 );
}
