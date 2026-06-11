import { CalendarDays, Clock3, MessageSquareQuote, Paperclip } from "lucide-react";

import { EmptyState } from "@/components/shared/states";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { Card } from "@/components/ui/card";
import { formatDate, formatDateTime } from "@/lib/utils/format";
import { requestPageSizeOptions } from "@/lib/utils/requests";
import type { RequestItem } from "@/types/requests";

import { RequestActions } from "@/components/requests/RequestActions";
import { RequestStatusBadge } from "@/components/requests/RequestStatusBadge";

interface MyRequestsTableProps {
 items: RequestItem[];
 page: number;
 pageSize: number;
 total: number;
 onPageChange: (page: number) => void;
 onPageSizeChange: (pageSize: number) => void;
 onView: (item: RequestItem) => void;
 onEdit: (item: RequestItem) => void;
 onCancel: (item: RequestItem) => void;
 onResubmit: (item: RequestItem) => void;
}

export function MyRequestsTable({
 items,
 page,
 pageSize,
 total,
 onPageChange,
 onPageSizeChange,
 onView,
 onEdit,
 onCancel,
 onResubmit,
}: MyRequestsTableProps) {
 if (!items.length) {
 return (
 <EmptyState
 title="No hay solicitudes para mostrar"
 description="Ajusta los filtros o registra una nueva solicitud para comenzar el flujo."
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
 "Codigo",
 "Tipo de solicitud",
 "Fechas",
 "Estado",
 "Motivo",
 "Respuesta del area",
 "Actualizacion",
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
 <strong className="font-semibold">{item.code}</strong>
 <span className="text-xs text-foreground-soft">
 Registrada el {formatDateTime(item.createdAt)}
 </span>
 </div>
 </td>
 <td className="p-4 text-sm text-foreground">
 <div className="grid gap-1">
 <strong className="font-semibold">{item.typeName}</strong>
 <span className="text-xs text-foreground-soft">{item.requester.fullName}</span>
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
 <RequestStatusBadge status={item.status} />
 </td>
 <td className="max-w-xs p-4 text-sm text-foreground">
 <div className="line-clamp-2">{item.reason}</div>
 </td>
 <td className="max-w-sm p-4 text-sm text-foreground-soft">
 {item.reviewComment ?? "Sin respuesta registrada todavia."}
 </td>
 <td className="p-4 text-sm text-foreground-soft">
 {formatDateTime(item.updatedAt ?? item.createdAt)}
 </td>
 <td className="p-4 text-sm text-foreground">
 <RequestActions
 item={item}
 isAdmin={false}
 compact
 onView={onView}
 onEdit={onEdit}
 onCancel={onCancel}
 onResubmit={onResubmit}
 onApprove={() => undefined}
 onReject={() => undefined}
 onObserve={() => undefined}
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
 <div className="flex flex-wrap items-start justify-between gap-3">
 <div className="grid gap-1">
 <div className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground-soft">
 {item.code}
 </div>
 <h3 className="text-lg font-semibold text-foreground">{item.typeName}</h3>
 <p className="text-sm text-foreground-soft">{item.reason}</p>
 </div>
 <RequestStatusBadge status={item.status} />
 </div>

 <div className="grid gap-3 rounded-[1.5rem] border border-border bg-muted/80 p-4 text-sm">
 <div className="inline-flex items-center gap-2 text-foreground-soft">
 <CalendarDays className="size-4 text-primary" />
 {formatDate(item.startDate)}
 {item.endDate ? ` - ${formatDate(item.endDate)}` : ""}
 </div>
 <div className="inline-flex items-start gap-2 text-foreground-soft">
 <MessageSquareQuote className="mt-0.5 size-4 text-primary" />
 <span>{item.reviewComment ?? "Sin respuesta del area por el momento."}</span>
 </div>
 <div className="flex flex-wrap items-center justify-between gap-3 text-foreground-soft">
 <span className="inline-flex items-center gap-2">
 <Clock3 className="size-4 text-primary" />
 {formatDateTime(item.updatedAt ?? item.createdAt)}
 </span>
 <span className="inline-flex items-center gap-2">
 <Paperclip className="size-4 text-primary" />
 {item.attachmentsCount ? `${item.attachmentsCount} adjunto(s)` : "Sin adjuntos"}
 </span>
 </div>
 </div>

 <RequestActions
 item={item}
 isAdmin={false}
 onView={onView}
 onEdit={onEdit}
 onCancel={onCancel}
 onResubmit={onResubmit}
 onApprove={() => undefined}
 onReject={() => undefined}
 onObserve={() => undefined}
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
