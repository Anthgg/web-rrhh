import { Paperclip } from "lucide-react";

import { Card } from "@/components/ui/card";
import { formatDate, formatDateTime } from "@/lib/utils/format";
import type { RequestItem } from "@/types/requests";

import { RequestActions } from "@/components/requests/RequestActions";
import { RequestStatusBadge } from "@/components/requests/RequestStatusBadge";

interface RequestTableProps {
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

export function RequestTable({
 items,
 isAdmin,
 onView,
 onEdit,
 onCancel,
 onResubmit,
 onApprove,
 onReject,
 onObserve,
}: RequestTableProps) {
 return (
 <Card className="hidden overflow-hidden p-0 lg:block">
 <div className="overflow-x-auto">
 <table className="min-w-full border-collapse">
 <thead className="bg-card-muted text-left">
 <tr>
 {[
 "Trabajador",
 "Tipo",
 "Fecha inicio",
 "Fecha fin",
 "Dias",
 "Estado",
 "Adjuntos",
 "Creacion",
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
 <td className="p-4 text-sm text-foreground">
 <div className="grid gap-1">
 <strong className="font-semibold">{item.typeName}</strong>
 <span className="text-xs text-foreground-soft">{item.reason}</span>
 </div>
 </td>
 <td className="p-4 text-sm text-foreground">{formatDate(item.startDate)}</td>
 <td className="p-4 text-sm text-foreground">{formatDate(item.endDate)}</td>
 <td className="p-4 text-sm text-foreground">
 {item.daysRequested ? `${item.daysRequested} dia(s)` : "No definido"}
 </td>
 <td className="p-4 text-sm text-foreground">
 <RequestStatusBadge status={item.status} />
 </td>
 <td className="p-4 text-sm text-foreground">
 {item.attachmentsCount > 0 ? (
 <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
 <Paperclip className="size-3.5" />
 {item.attachmentsCount}
 </span>
 ) : (
 <span className="text-xs text-foreground-soft">Sin adjuntos</span>
 )}
 </td>
 <td className="p-4 text-sm text-foreground-soft">
 {formatDateTime(item.createdAt)}
 </td>
 <td className="p-4 text-sm text-foreground">
 <RequestActions
 item={item}
 isAdmin={isAdmin}
 compact
 onView={onView}
 onEdit={onEdit}
 onCancel={onCancel}
 onResubmit={onResubmit}
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
 );
}
