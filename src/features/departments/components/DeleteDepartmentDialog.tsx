"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";

import { departmentsService } from "@/services/departments.service";
import type { DepartmentDefinition } from "@/types";

interface DeleteDepartmentDialogProps {
 isOpen: boolean;
 onClose: () => void;
 department: DepartmentDefinition;
}

export function DeleteDepartmentDialog({ isOpen, onClose, department }: DeleteDepartmentDialogProps) {
 const queryClient = useQueryClient();
 const [error, setError] = useState<string | null>(null);

 const mutation = useMutation({
 mutationFn: () => departmentsService.delete(department.id),
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["departments"] });
 queryClient.invalidateQueries({ queryKey: ["organization"] });
 onClose();
 },
 onError: (err: any) => {
 const code = err?.details?.code || err?.code;
 if (code === "DEPARTMENT_HAS_ACTIVE_WORKERS") {
 setError("No se puede eliminar este departamento porque tiene trabajadores activos asociados.");
 } else {
 setError(err?.message || "Ocurrió un error al intentar eliminar el departamento.");
 }
 },
 });

 if (!isOpen) return null;

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm">
 <div className="w-full max-w-md overflow-hidden rounded-2xl bg-card shadow-xl">
 <div className="p-6">
 <div className="flex items-center gap-4">
 <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-rose-100">
 <AlertTriangle className="size-6 text-rose-600" />
 </div>
 <div>
 <h3 className="text-lg font-bold text-foreground">Eliminar departamento</h3>
 <p className="mt-1 text-sm text-muted-foreground">
 ¿Estás seguro de que deseas eliminar el departamento{" "}
 <span className="font-medium text-foreground">{department.name}</span>? Esta acción
 no se puede deshacer.
 </p>
 </div>
 </div>

 {error && (
 <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
 {error}
 </div>
 )}
 </div>

 <div className="flex items-center justify-end gap-3 bg-muted px-6 py-4">
 <button
 type="button"
 className="rounded-xl px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted"
 onClick={onClose}
 disabled={mutation.isPending}
 >
 Cancelar
 </button>
 <button
 type="button"
 className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:pointer-events-none disabled:opacity-50"
 onClick={() => mutation.mutate()}
 disabled={mutation.isPending}
 >
 {mutation.isPending ? "Eliminando..." : "Sí, eliminar"}
 </button>
 </div>
 </div>
 </div>
 );
}
