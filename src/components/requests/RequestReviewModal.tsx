"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Eye, RotateCcw, Trash2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FieldFrame, Textarea } from "@/components/ui/fields";
import type { RequestItem, RequestReviewAction } from "@/types/requests";

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
 tone: "bg-emerald-100 text-emerald-700",
 confirmLabel: "Aprobar",
 requireComment: false,
 commentLabel: "Comentario opcional",
 },
 observe: {
 title: "Observar solicitud",
 description: "Debes indicar claramente qué debe corregirse antes de que la solicitud sea reenviada.",
 icon: Eye,
 tone: "bg-indigo-100 text-indigo-700",
 confirmLabel: "Registrar observacion",
 requireComment: true,
 commentLabel: "Observacion requerida",
 },
 reject: {
 title: "Rechazar solicitud",
 description: "El rechazo exige un sustento visible para evitar decisiones opacas en la operación diaria.",
 icon: XCircle,
 tone: "bg-rose-100 text-rose-700",
 confirmLabel: "Rechazar",
 requireComment: true,
 commentLabel: "Motivo del rechazo",
 },
 cancel: {
 title: "Cancelar solicitud",
 description: "La solicitud quedará marcada como cancelada y dejará de participar en el flujo de revisión.",
 icon: Trash2,
 tone: "bg-slate-200 text-foreground",
 confirmLabel: "Cancelar solicitud",
 requireComment: false,
 commentLabel: "Comentario opcional",
 },
 resubmit: {
 title: "Reenviar solicitud",
 description: "Usa esta acción cuando la solicitud ya fue corregida y deba volver a revisión.",
 icon: RotateCcw,
 tone: "bg-sky-100 text-sky-700",
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
 <div className="flex items-start gap-3 rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
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
