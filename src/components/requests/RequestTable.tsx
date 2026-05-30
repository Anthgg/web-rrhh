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
          <thead className="bg-surface-muted text-left">
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
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-white">
            {items.map((item) => (
              <tr key={item.id} className="align-top transition-colors hover:bg-slate-50/70">
                <td className="p-4 text-sm text-ink">
                  <div className="grid gap-1">
                    <strong className="font-semibold">{item.requester.fullName}</strong>
                    <span className="text-xs text-ink-soft">{item.code}</span>
                  </div>
                </td>
                <td className="p-4 text-sm text-ink">
                  <div className="grid gap-1">
                    <strong className="font-semibold">{item.typeName}</strong>
                    <span className="text-xs text-ink-soft">{item.reason}</span>
                  </div>
                </td>
                <td className="p-4 text-sm text-ink">{formatDate(item.startDate)}</td>
                <td className="p-4 text-sm text-ink">{formatDate(item.endDate)}</td>
                <td className="p-4 text-sm text-ink">
                  {item.daysRequested ? `${item.daysRequested} dia(s)` : "No definido"}
                </td>
                <td className="p-4 text-sm text-ink">
                  <RequestStatusBadge status={item.status} />
                </td>
                <td className="p-4 text-sm text-ink">
                  {item.attachmentsCount > 0 ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      <Paperclip className="size-3.5" />
                      {item.attachmentsCount}
                    </span>
                  ) : (
                    <span className="text-xs text-ink-soft">Sin adjuntos</span>
                  )}
                </td>
                <td className="p-4 text-sm text-ink-soft">
                  {formatDateTime(item.createdAt)}
                </td>
                <td className="p-4 text-sm text-ink">
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
