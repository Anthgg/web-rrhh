"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { areasService } from "@/services/areas.service";

interface DeleteAreaDialogProps {
 isOpen: boolean;
 onClose: () => void;
 areaId: string | null;
 areaName: string | null;
}

export function DeleteAreaDialog({ isOpen, onClose, areaId, areaName }: DeleteAreaDialogProps) {
 const queryClient = useQueryClient();
 const [globalError, setGlobalError] = useState<{ message: string; details?: unknown } | null>(null);

 const mutation = useMutation({
 mutationFn: () => areasService.delete(areaId as string),
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["areas"] });
 onClose();
 },
 onError: (error: any) => {
 const status = error?.status;
 const details = error?.details;
 
 if (status === 409 || status === 422) {
 setGlobalError({ message: "El área no puede ser eliminada porque tiene trabajadores asignados o dependencias. Intenta desactivarla en su lugar.", details });
 } else {
 setGlobalError({
 message: error?.message || "Ocurrió un error al intentar eliminar el área.",
 details,
 });
 }
 },
 });

 if (!isOpen || !areaId) return null;

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm">
 <div className="w-full max-w-md overflow-hidden rounded-2xl bg-card shadow-xl">
 <div className="flex items-center justify-between border-b border-border p-6">
 <div className="flex items-center gap-3 text-rose-600">
 <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-rose-100">
 <AlertTriangle className="size-5" />
 </div>
 <h2 className="text-xl font-bold">Eliminar Área</h2>
 </div>
 <button type="button"
 onClick={onClose}
 className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-muted-foreground"
 >
 <X className="size-5" />
 </button>
 </div>

 <div className="p-6">
 <p className="text-sm leading-relaxed text-muted-foreground">
 ¿Estás seguro que deseas eliminar el área <strong className="font-semibold text-foreground">{areaName || areaId}</strong>?
 </p>
 <p className="mt-2 text-sm text-muted-foreground">
 Esta acción no se puede deshacer. Si el área está asignada a trabajadores, la base de datos rechazará la eliminación. Considera desactivarla si tienes dudas.
 </p>

 {globalError && (
 <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
 <p className="font-semibold">No se pudo eliminar</p>
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
 <button type="button"
 onClick={() => mutation.mutate()}
 disabled={mutation.isPending}
 className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:pointer-events-none disabled:opacity-50"
 >
 {mutation.isPending ? (
 <div className="flex items-center gap-2">
 <div className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
 <span>Eliminando...</span>
 </div>
 ) : (
 <>
 <Trash2 className="size-4" />
 <span>Sí, eliminar área</span>
 </>
 )}
 </button>
 </div>
 </div>
 </div>
 );
}
