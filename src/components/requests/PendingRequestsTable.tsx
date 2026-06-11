import { Building2, CalendarDays, Paperclip, UserRound } from "lucide-react";

import { EmptyState } from "@/components/shared/states";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { Card } from "@/components/ui/card";
import { formatDate, formatDateTime } from "@/lib/utils/format";
import { requestPageSizeOptions } from "@/lib/utils/requests";
import type { RequestItem } from "@/types/requests";

import { RequestActions } from "@/components/requests/RequestActions";
import { RequestStatusBadge } from "@/components/requests/RequestStatusBadge";

interface PendingRequestsTableProps {
 items: RequestItem[];
 page: number;
 pageSize: number;
 total: number;
 onPageChange: (page: number) => void;
 onPageSizeChange: (pageSize: number) => void;
 onView: (item: RequestItem) => void;
 onApprove: (item: RequestItem) => void;
 onReject: (item: RequestItem) => void;
 onObserve: (item: RequestItem) => void;
}

export function PendingRequestsTable({
 items,
 page,
 pageSize,
 total,
 onPageChange,
 onPageSizeChange,
 onView,
 onApprove,
 onReject,
 onObserve,
}: PendingRequestsTableProps) {
 if (!items.length) {
 return (
 <EmptyState
 title="No hay solicitudes pendientes"
 description="Ajusta los filtros o vuelve mas tarde para revisar nuevas solicitudes en bandeja."
 />
 );
 }

 return (
 <div className="grid gap-4">
 <Card className="hidden overflow-hidden p-0 lg:block">
 <div className="overflow-x-auto">
 <table className="min-w-full border-collapse">
 <thead className="bg-card-muted text-left">
 <tr>
 {[
 "Trabajador",
 "Area / sede",
 "Tipo",
 "Fechas",
 "Adjuntos",
 "Estado",
 "Enviada",
 "Acciones",
 ].map((header) => (
 <th
 key={header}
 className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-foreground-soft"
 >
 {header}
 </th>
 ))}
 </tr>
 </thead>
 <tbody className="divide-y divide-border bg-card">
 {items.map((item) => (
 <tr key={item.id} className="align-top transition-colors hover:bg-muted/70">
 <td className="p-4 text-sm text-foreground">
 <div className="grid gap-1">
 <strong className="font-semibold">{item.requester.fullName}</strong>
 <span className="text-xs text-foreground-soft">{item.code}</span>
 </div>
 </td>
 <td className="p-4 text-sm text-foreground-soft">
 <div className="grid gap-1">
 <span>{item.requester.department ?? "Sin area"}</span>
 <span className="text-xs">{item.requester.project ?? "Sin sede"}</span>
 </div>
 </td>
 <td className="p-4 text-sm text-foreground">
 <div className="grid gap-1">
 <strong className="font-semibold">{item.typeName}</strong>
 <span className="text-xs text-foreground-soft">{item.reason}</span>
 </div>
 </td>
 <td className="p-4 text-sm text-foreground">
 <div className="grid gap-1">
 <span>{formatDate(item.startDate)}</span>
 <span className="text-xs text-foreground-soft">
 {item.endDate ? `Hasta ${formatDate(item.endDate)}` : "Sin fecha fin"}
 </span>
 </div>
 </td>
 <td className="p-4 text-sm text-foreground">
 {item.attachmentsCount ? (
 <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
 <Paperclip className="size-3.5" />
 {item.attachmentsCount}
 </span>
 ) : (
 <span className="text-xs text-foreground-soft">Sin adjuntos</span>
 )}
 </td>
 <td className="p-4 text-sm text-foreground">
 <RequestStatusBadge status={item.status} />
 </td>
 <td className="p-4 text-sm text-foreground-soft">
 {formatDateTime(item.createdAt)}
 </td>
 <td className="p-4 text-sm text-foreground">
 <RequestActions
 item={item}
 isAdmin
 compact
 onView={onView}
 onEdit={() => undefined}
 onCancel={() => undefined}
 onResubmit={() => undefined}
 onApprove={onApprove}
 onReject={onReject}
 onObserve={onObserve}
 />
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </Card>

 <div className="grid gap-4 lg:hidden">
 {items.map((item) => (
 <Card key={item.id} className="grid gap-4 p-5">
 <div className="flex items-start justify-between gap-3">
 <div className="grid gap-1">
 <h3 className="text-lg font-semibold text-foreground">{item.typeName}</h3>
 <p className="text-sm text-foreground-soft">{item.code}</p>
 </div>
 <RequestStatusBadge status={item.status} />
 </div>

 <div className="grid gap-3 rounded-[1.5rem] border border-border bg-muted/80 p-4 text-sm text-foreground-soft">
 <div className="inline-flex items-center gap-2">
 <UserRound className="size-4 text-primary" />
 {item.requester.fullName}
 </div>
 <div className="inline-flex items-center gap-2">
 <Building2 className="size-4 text-primary" />
 {item.requester.department ?? "Sin area"} · {item.requester.project ?? "Sin sede"}
 </div>
 <div className="inline-flex items-center gap-2">
 <CalendarDays className="size-4 text-primary" />
 {formatDate(item.startDate)}
 {item.endDate ? ` - ${formatDate(item.endDate)}` : ""}
 </div>
 <div className="flex items-center gap-2">
 <Paperclip className="size-4 text-primary" />
 {item.attachmentsCount ? `${item.attachmentsCount} adjunto(s)` : "Sin adjuntos"}
 </div>
 </div>

 <RequestActions
 item={item}
 isAdmin
 onView={onView}
 onEdit={() => undefined}
 onCancel={() => undefined}
 onResubmit={() => undefined}
 onApprove={onApprove}
 onReject={onReject}
 onObserve={onObserve}
 />
 </Card>
 ))}
 </div>

 <PaginationControls
 page={page}
 pageSize={pageSize}
 total={total}
 pageSizeOptions={requestPageSizeOptions}
 onPageChange={onPageChange}
 onPageSizeChange={onPageSizeChange}
 />
 </div>
 );
}
