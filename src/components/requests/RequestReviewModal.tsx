"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Eye, RotateCcw, Trash2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FieldFrame, Textarea } from "@/components/ui/fields";
import type { RequestItem, RequestReviewAction } from "@/types/requests";
import { useVacationBalance } from "@/hooks/useVacationBalance";

import { RequestModalShell } from "@/components/requests/request-modal-shell";

interface RequestReviewModalProps {
 isOpen: boolean;
 action: RequestReviewAction | null;
 request: RequestItem | null;
 isSubmitting?: boolean;
 onClose: () => void;
 onConfirm: (comment?: string) => void;
}

const actionConfig = {
  approve: {
    title: "Aprobar solicitud",
    description: "La solicitud quedará aprobada y visible para el trabajador con esta decisión.",
    icon: CheckCircle2,
    tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    confirmLabel: "Aprobar",
    requireComment: false,
    commentLabel: "Comentario opcional",
  },
  observe: {
    title: "Observar solicitud",
    description: "Debes indicar claramente qué debe corregirse antes de que la solicitud sea reenviada.",
    icon: Eye,
    tone: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    confirmLabel: "Registrar observacion",
    requireComment: true,
    commentLabel: "Observacion requerida",
  },
  reject: {
    title: "Rechazar solicitud",
    description: "El rechazo exige un sustento visible para evitar decisiones opacas en la operación diaria.",
    icon: XCircle,
    tone: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    confirmLabel: "Rechazar",
    requireComment: true,
    commentLabel: "Motivo del rechazo",
  },
  cancel: {
    title: "Cancelar solicitud",
    description: "La solicitud quedará marcada como cancelada y dejará de participar en el flujo de revisión.",
    icon: Trash2,
    tone: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
    confirmLabel: "Cancelar solicitud",
    requireComment: false,
    commentLabel: "Comentario opcional",
  },
  resubmit: {
    title: "Reenviar solicitud",
    description: "Usa esta acción cuando la solicitud ya fue corregida y deba volver a revisión.",
    icon: RotateCcw,
    tone: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    confirmLabel: "Reenviar",
    requireComment: false,
    commentLabel: "Comentario opcional",
  },
} as const;

export function RequestReviewModal({
 isOpen,
 action,
 request,
 isSubmitting = false,
 onClose,
 onConfirm,
}: RequestReviewModalProps) {
 const [comment, setComment] = useState("");
 const [showError, setShowError] = useState(false);

 const workerId = request?.workerId;
 const isVacation = request ? (request.typeName.toLowerCase().includes("vacac") || !!request.requiresBalanceOverride) : false;
 const shouldFetch = isOpen && action === "approve" && isVacation && !!workerId;
 const { data: currentBalance, isLoading: isLoadingBalance, isError: isErrorBalance } = useVacationBalance({
   workerId,
   enabled: shouldFetch,
 });

 if (!action || !request) return null;

 const config = actionConfig[action];
 const Icon = config.icon;

 return (
 <RequestModalShell
 isOpen={isOpen}
 onClose={onClose}
 title={config.title}
 subtitle={config.description}
 size="md"
 footer={
 <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
 <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
 Cerrar
 </Button>
 <Button
 onClick={() => {
 if (config.requireComment && !comment.trim()) {
 setShowError(true);
 return;
 }

 onConfirm(comment.trim() || undefined);
 }}
 disabled={isSubmitting}
 variant={action === "reject" ? "danger" : "primary"}
 >
 {config.confirmLabel}
 </Button>
 </div>
 }
 >
 <div className="grid gap-5">
 <div className="rounded-[1.5rem] border border-border bg-card/90 p-5">
 <div className="flex items-start gap-4">
 <div className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${config.tone}`}>
 <Icon className="size-5" />
 </div>
 <div className="grid gap-2">
 <div>
 <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground-soft">
 Solicitud
 </p>
 <h3 className="section-title text-xl font-semibold text-foreground">{request.typeName}</h3>
 </div>
 <p className="text-sm text-foreground-soft">
 {request.code} · {request.requester.fullName}
 </p>
 </div>
 </div>
 </div>

  {action === "approve" && isVacation && (
   <div className="rounded-[1.5rem] border border-amber-500/20 bg-amber-500/10 p-5 space-y-3">
    <div className="flex items-start gap-3">
     <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
     <div className="space-y-2">
      <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-300">
       Confirmación de Saldo Vacacional
      </h4>
      {isLoadingBalance ? (
       <p className="text-xs text-amber-700 dark:text-amber-400 animate-pulse">
        Consultando saldo actual del trabajador...
       </p>
      ) : isErrorBalance || !currentBalance ? (
       <p className="text-xs text-amber-700 dark:text-amber-400">
        No se pudo consultar el saldo actual del trabajador. Por favor, proceda con precaución.
       </p>
      ) : (() => {
       const X = request.vacationBalance?.availableDaysAtRequest ?? 0;
       const Y = request.daysRequested ?? request.vacationBalance?.requestedDays ?? 0;
       const isPending = request.status === "pending";
       const A = currentBalance.availableDays + (isPending ? Y : 0);
       const B = A - Y;
       const C = B;
       const formatVal = (val: number) => parseFloat(val.toFixed(2)).toString();

       return (
        <div className="space-y-2 text-xs text-amber-800 dark:text-amber-400 leading-relaxed">
         <p>
          El trabajador tiene <strong className="font-semibold text-amber-950 dark:text-amber-200">{formatVal(X)} días disponibles (saldo histórico)</strong> al crear la solicitud y solicita <strong className="font-semibold text-amber-950 dark:text-amber-200">{formatVal(Y)} días</strong>.
         </p>
         <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="rounded-lg bg-amber-500/5 p-2 border border-amber-500/10">
           <span className="block text-[10px] uppercase font-bold text-amber-800/80 dark:text-amber-400/80">Saldo actual</span>
           <span className="text-sm font-black text-amber-950 dark:text-amber-200">{formatVal(A)} días</span>
          </div>
          <div className="rounded-lg bg-amber-500/5 p-2 border border-amber-500/10">
           <span className="block text-[10px] uppercase font-bold text-amber-800/80 dark:text-amber-400/80">Saldo proyectado actual</span>
           <span className="text-sm font-black text-amber-950 dark:text-amber-200">{formatVal(B)} días</span>
          </div>
         </div>
         <p className="pt-1">
          Esta aprobación dejará un saldo proyectado de <strong className="font-semibold text-amber-950 dark:text-amber-200">{formatVal(C)} días</strong>. ¿Deseas continuar?
         </p>
        </div>
       );
      })()}
     </div>
    </div>
   </div>
  )}

 <FieldFrame
 label={config.commentLabel}
 error={showError ? "Este comentario es obligatorio para continuar." : undefined}
 hint={config.requireComment ? undefined : "Puedes dejar contexto adicional si hace falta."}
 >
 <Textarea
 value={comment}
 onChange={(event) => {
 setComment(event.target.value);
 if (showError && event.target.value.trim()) {
 setShowError(false);
 }
 }}
 placeholder={
 config.requireComment
 ? "Explica la decision para que quede trazabilidad clara."
 : "Agrega una nota si aporta contexto."
 }
 />
 </FieldFrame>

 {config.requireComment ? (
 <div className="flex items-start gap-3 rounded-[1.5rem] border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
 <AlertTriangle className="mt-0.5 size-4 shrink-0" />
 <p>
 Rechazar u observar sin comentario degrada la trazabilidad del flujo y deja al
 trabajador sin contexto accionable.
 </p>
 </div>
 ) : null}
 </div>
 </RequestModalShell>
 );
}
