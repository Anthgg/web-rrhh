"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { organizationService } from "@/services/organization.service";

interface DeleteWorkLocationDialogProps {
 isOpen: boolean;
 onClose: () => void;
 locationId: string | null;
 locationName: string | null;
}

export function DeleteWorkLocationDialog({
 isOpen,
 onClose,
 locationId,
 locationName,
}: DeleteWorkLocationDialogProps) {
 const queryClient = useQueryClient();
 const [globalError, setGlobalError] = useState<{
 message: string;
 details?: unknown;
 } | null>(null);

 const mutation = useMutation({
 mutationFn: async () => {
 try {
 await organizationService.deleteWorkLocation(locationId as string);
 } catch (err: any) {
 // If backend rejects hard delete (409/422), fall back to deactivate
 const status = err?.status ?? err?.response?.status;
 if (status === 409 || status === 422 || status === 400) {
 await organizationService.updateWorkLocationStatus(
 locationId as string,
 false
 );
 } else {
 throw err;
 }
 }
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["work-locations"] });
 onClose();
 },
 onError: (error: any) => {
 setGlobalError({
 message:
 error?.message ||
 "Ocurrió un error al intentar eliminar el lugar de trabajo.",
 details: error?.details,
 });
 },
 });

 if (!isOpen || !locationId) return null;

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm">
 <div className="w-full max-w-md overflow-hidden rounded-2xl bg-card shadow-xl">
 <div className="flex items-center justify-between border-b border-border p-6">
 <div className="flex items-center gap-3 text-rose-600">
 <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-rose-100">
 <AlertTriangle className="size-5" />
 </div>
 <h2 className="text-xl font-bold">Eliminar Lugar de Trabajo</h2>
 </div>
 <button
 type="button"
 onClick={onClose}
 className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-muted-foreground"
 >
 <X className="size-5" />
 </button>
 </div>

 <div className="p-6">
 <p className="text-sm leading-relaxed text-muted-foreground">
 ¿Estás seguro que deseas eliminar el lugar de trabajo{" "}
 <strong className="font-semibold text-foreground">
 {locationName || locationId}
 </strong>
 ?
 </p>
 <p className="mt-2 text-sm text-muted-foreground">
 Si el lugar tiene trabajadores asignados, se desactivará
 automáticamente en lugar de eliminarse. Puedes reactivarlo en
 cualquier momento.
 </p>

 {globalError && (
 <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
 <p className="font-semibold">No se pudo completar</p>
 <p className="mt-1">{globalError.message}</p>
 </div>
 )}
 </div>

 <div className="flex flex-col-reverse gap-3 border-t border-border bg-muted/50 p-6 sm:flex-row sm:justify-end">
 <button
 type="button"
 className="rounded-xl px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-slate-200"
 onClick={onClose}
 disabled={mutation.isPending}
 >
 Cancelar
 </button>
 <button
 type="button"
 onClick={() => mutation.mutate()}
 disabled={mutation.isPending}
 className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:pointer-events-none disabled:opacity-50"
 >
 {mutation.isPending ? (
 <>
 <div className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
 <span>Procesando...</span>
 </>
 ) : (
 <>
 <Trash2 className="size-4" />
 <span>Sí, eliminar</span>
 </>
 )}
 </button>
 </div>
 </div>
 </div>
 );
}
