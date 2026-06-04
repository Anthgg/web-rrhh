import { Loader2, Users } from "lucide-react";
import { WorkerRecord } from "@/types";
import { WorkerSelectableRow } from "./WorkerSelectableRow";

interface AvailableWorkersListProps {
  workers: WorkerRecord[];
  isLoading: boolean;
  selectedIds: Set<string>;
  onToggleWorker: (workerId: string) => void;
  existingWorkerIds: string[];
}

export function AvailableWorkersList({
  workers,
  isLoading,
  selectedIds,
  onToggleWorker,
  existingWorkerIds,
}: AvailableWorkersListProps) {
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
        <Loader2 className="size-8 animate-spin mb-4 text-indigo-500" />
        <p className="text-sm">Buscando trabajadores...</p>
      </div>
    );
  }

  if (workers.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 border border-dashed border-slate-200 rounded-xl m-4">
        <Users className="size-12 mb-4 text-slate-300" />
        <h3 className="text-lg font-semibold text-slate-900 mb-1">No se encontraron resultados</h3>
        <p className="text-sm text-center max-w-sm">
          No hay trabajadores que coincidan con tu búsqueda o filtros actuales.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50">
      {workers.map((worker) => (
        <WorkerSelectableRow
          key={worker.id}
          worker={worker}
          isSelected={selectedIds.has(worker.id)}
          onToggle={() => onToggleWorker(worker.id)}
          isAlreadyInCrew={existingWorkerIds.includes(worker.id)}
        />
      ))}
    </div>
  );
}
