import { CalendarDays, Clock3, FolderKanban, Paperclip } from "lucide-react";

import { Card } from "@/components/ui/card";
import { formatDate, formatDateTime } from "@/lib/utils/format";
import type { RequestItem } from "@/types/requests";

import { RequestActions } from "@/components/requests/RequestActions";
import { RequestStatusBadge } from "@/components/requests/RequestStatusBadge";

interface RequestCardListProps {
 items: RequestItem[];
 isAdmin: boolean;
 onView: (item: RequestItem) => void;
 onEdit: (item: RequestItem) => void;
 onCancel: (item: RequestItem) => void;
 onResubmit: (item: RequestItem) => void;
 onApprove: (item: RequestItem) => void;
 onReject: (item: RequestItem) => void;
 onObserve: (item: RequestItem) => void;
}

export function RequestCardList({
 items,
 isAdmin,
 onView,
 onEdit,
 onCancel,
 onResubmit,
 onApprove,
 onReject,
 onObserve,
}: RequestCardListProps) {
 return (
 <div className="grid gap-4 lg:hidden">
 {items.map((item) => (
 <Card key={item.id} className="grid gap-4 p-5">
 <div className="flex flex-wrap items-start justify-between gap-3">
 <div className="grid gap-2">
 <div>
 <h3 className="section-title text-xl font-semibold text-foreground">{item.typeName}</h3>
 <p className="text-sm text-foreground-soft">{item.requester.fullName}</p>
 </div>
 <div className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground-soft">
 {item.code}
 </div>
 </div>
 <RequestStatusBadge status={item.status} />
 </div>

 <div className="grid gap-3 text-sm text-foreground">
 <div className="flex items-start gap-2">
 <FolderKanban className="mt-0.5 size-4 text-primary" />
 <p>{item.reason}</p>
 </div>

 <div className="grid gap-2 text-foreground-soft sm:grid-cols-2">
 <div className="inline-flex items-center gap-2">
 <CalendarDays className="size-4 text-primary" />
 {formatDate(item.startDate)}{item.endDate ? ` - ${formatDate(item.endDate)}` : ""}
 </div>
 <div className="inline-flex items-center gap-2">
 <Clock3 className="size-4 text-primary" />
 {item.daysRequested ? `${item.daysRequested} dia(s)` : "Dias no definidos"}
 </div>
 </div>
 </div>

 <div className="grid gap-3 rounded-[1.5rem] border border-border bg-muted/80 p-4">
 <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-foreground-soft">
 <span>Creada el {formatDateTime(item.createdAt)}</span>
 <span className="inline-flex items-center gap-2">
 <Paperclip className="size-4 text-primary" />
 {item.attachmentsCount ? `${item.attachmentsCount} adjunto(s)` : "Sin adjuntos"}
 </span>
 </div>

 <RequestActions
 item={item}
 isAdmin={isAdmin}
 onView={onView}
 onEdit={onEdit}
 onCancel={onCancel}
 onResubmit={onResubmit}
 onApprove={onApprove}
 onReject={onReject}
 onObserve={onObserve}
 />
 </div>
 </Card>
 ))}
 </div>
 );
}
