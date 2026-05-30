import {
  CheckCircle2,
  Eye,
  FilePenLine,
  RotateCcw,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { RequestItem } from "@/types/requests";

interface RequestActionsProps {
  item: RequestItem;
  isAdmin: boolean;
  compact?: boolean;
  onView: (item: RequestItem) => void;
  onEdit: (item: RequestItem) => void;
  onCancel: (item: RequestItem) => void;
  onResubmit: (item: RequestItem) => void;
  onApprove: (item: RequestItem) => void;
  onReject: (item: RequestItem) => void;
  onObserve: (item: RequestItem) => void;
}

export function RequestActions({
  item,
  isAdmin,
  compact = false,
  onView,
  onEdit,
  onCancel,
  onResubmit,
  onApprove,
  onReject,
  onObserve,
}: RequestActionsProps) {
  const actionClassName = compact ? "h-9 rounded-2xl px-3" : "h-10 rounded-2xl px-3";
  const primaryActionClassName = compact
    ? "h-9 rounded-2xl px-3 shadow-[0_14px_28px_rgba(15,23,42,0.14)]"
    : "h-10 rounded-2xl px-3 shadow-[0_18px_36px_rgba(15,23,42,0.14)]";
  const approveClassName = cn(
    primaryActionClassName,
    "bg-emerald-600 text-white hover:bg-emerald-700",
  );
  const observeClassName = cn(
    actionClassName,
    "border border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-300 hover:bg-amber-100 hover:text-amber-900",
  );
  const rejectClassName = cn(
    primaryActionClassName,
    "bg-rose-600 text-white hover:bg-rose-700",
  );
  const viewClassName = cn(
    actionClassName,
    "border border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900",
  );

  return (
    <div className="flex flex-wrap gap-2">
      {isAdmin ? (
        item.canReview ? (
          <>
            <Button className={approveClassName} onClick={() => onApprove(item)}>
              <CheckCircle2 className="mr-2 size-4" />
              Aprobar
            </Button>
            <Button className={observeClassName} onClick={() => onObserve(item)}>
              <Eye className="mr-2 size-4" />
              Observar
            </Button>
            <Button className={rejectClassName} onClick={() => onReject(item)}>
              <XCircle className="mr-2 size-4" />
              Rechazar
            </Button>
          </>
        ) : null
      ) : (
        <>
          {item.canEdit ? (
            <Button variant="secondary" className={actionClassName} onClick={() => onEdit(item)}>
              <FilePenLine className="mr-2 size-4" />
              Editar
            </Button>
          ) : null}

          {item.canResubmit ? (
            <Button className={actionClassName} onClick={() => onResubmit(item)}>
              <RotateCcw className="mr-2 size-4" />
              Reenviar
            </Button>
          ) : null}

          {item.canCancel ? (
            <Button
              variant="ghost"
              className={`${actionClassName} text-rose-700 hover:bg-rose-50 hover:text-rose-700`}
              onClick={() => onCancel(item)}
            >
              <Trash2 className="mr-2 size-4" />
              Cancelar
            </Button>
          ) : null}
        </>
      )}

      <Button className={viewClassName} onClick={() => onView(item)}>
        <Search className="mr-2 size-4" />
        Ver
      </Button>
    </div>
  );
}
