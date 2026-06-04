import { Loader2, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
  conflictCount: number;
}

export function ConfirmAssignmentDialog({ isOpen, onClose, onConfirm, isPending, conflictCount }: ConfirmAssignmentDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 p-4">
      <div className="flex w-full max-w-md flex-col rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-start gap-4 p-6">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <AlertTriangle className="size-5" />
          </div>
          <div className="flex-1 pt-1">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Advertencia de Asignación</h3>
            <p className="text-sm text-slate-600">
              Estás a punto de asignar a <span className="font-semibold">{conflictCount} {conflictCount === 1 ? "trabajador" : "trabajadores"}</span> que ya tienen una asignación activa u obra principal asignada.
            </p>
            <p className="text-sm text-slate-600 mt-2">
              Si continúas, sus asignaciones previas podrían verse afectadas o reescritas dependiendo de las reglas del sistema. ¿Deseas asignarlos de todos modos?
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="size-4" />
          </button>
        </div>
        
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={isPending} className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm border-transparent">
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Asignar de todos modos
          </Button>
        </div>
      </div>
    </div>
  );
}
