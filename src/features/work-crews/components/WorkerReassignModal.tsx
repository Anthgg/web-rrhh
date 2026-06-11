"use client";

import { useState } from "react";
import { ArrowRightLeft, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FieldFrame, Input } from "@/components/ui/fields";
import { getApiErrorMessage } from "@/lib/api/error-handlers";
import { workersService } from "@/services/workers.service";

interface WorkerReassignModalProps {
 isOpen: boolean;
 onClose: () => void;
 workerId: string;
 targetWorkLocationId: string;
 targetCrewId?: string | null;
 onSuccess?: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export function WorkerReassignModal({
 isOpen,
 onClose,
 workerId,
 targetWorkLocationId,
 targetCrewId,
 onSuccess,
}: WorkerReassignModalProps) {
 const [reason, setReason] = useState("Reasignacion operativa");
 const [effectiveDate, setEffectiveDate] = useState(today);
 const [isSubmitting, setIsSubmitting] = useState(false);

 if (!isOpen) return null;

 const submit = async () => {
 if (!reason.trim()) {
 toast.error("Ingresa un motivo para la reasignacion.");
 return;
 }

 try {
 setIsSubmitting(true);
 await workersService.reassign(workerId, {
 targetWorkLocationId,
 targetCrewId: targetCrewId || null,
 reason: reason.trim(),
 effectiveDate,
 });
 toast.success("Trabajador reasignado correctamente.");
 onSuccess?.();
 onClose();
 } catch (error) {
 toast.error(getApiErrorMessage(error, "No se pudo reasignar el trabajador."));
 } finally {
 setIsSubmitting(false);
 }
 };

 return (
 <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
 <section className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
 <header className="flex items-center justify-between border-b border-border px-5 py-4">
 <div className="flex items-center gap-3">
 <span className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
 <ArrowRightLeft className="size-5" />
 </span>
 <div>
 <h2 className="text-base font-bold text-slate-950">Reasignar trabajador</h2>
 <p className="text-sm text-muted-foreground">Confirma el movimiento operativo solicitado.</p>
 </div>
 </div>
 <button
 type="button"
 className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-muted-foreground"
 onClick={onClose}
 disabled={isSubmitting}
 aria-label="Cerrar"
 >
 <X className="size-5" />
 </button>
 </header>
 <div className="grid gap-4 p-5">
 <FieldFrame label="Motivo">
 <Input value={reason} onChange={(event) => setReason(event.target.value)} disabled={isSubmitting} />
 </FieldFrame>
 <FieldFrame label="Fecha efectiva">
 <Input type="date" value={effectiveDate} onChange={(event) => setEffectiveDate(event.target.value)} disabled={isSubmitting} />
 </FieldFrame>
 </div>
 <footer className="flex justify-end gap-2 border-t border-border bg-muted px-5 py-4">
 <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
 Cancelar
 </Button>
 <Button type="button" className="gap-2" onClick={submit} disabled={isSubmitting}>
 {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
 Reasignar
 </Button>
 </footer>
 </section>
 </div>
 );
}
