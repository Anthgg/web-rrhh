import { Loader2, Users } from "lucide-react";
import { WorkerRecord } from "@/types";
import { WorkerSelectableRow } from "./WorkerSelectableRow";
import { WorkCrew } from "@/services/work-crews.service";

interface AvailableWorkersListProps {
 workers: WorkerRecord[];
 isLoading: boolean;
 selectedIds: Set<string>;
 onToggleWorker: (workerId: string) => void;
 existingWorkerIds: string[];
 crew: WorkCrew;
 canReassign?: boolean;
}

export function AvailableWorkersList({
 workers,
 isLoading,
 selectedIds,
 onToggleWorker,
 existingWorkerIds,
 crew,
 canReassign = false,
}: AvailableWorkersListProps) {
 if (isLoading) {
 return (
 <div className="flex-1 flex flex-col items-center justify-center p-12 text-muted-foreground">
 <Loader2 className="size-8 animate-spin mb-4 text-indigo-500" />
 <p className="text-sm">Buscando trabajadores...</p>
 </div>
 );
 }

 if (workers.length === 0) {
 return (
 <div className="flex-1 flex flex-col items-center justify-center p-12 text-muted-foreground border border-dashed border-border rounded-xl m-4">
 <Users className="size-12 mb-4 text-slate-300" />
 <h3 className="text-lg font-semibold text-foreground mb-1">No se encontraron resultados</h3>
 <p className="text-sm text-center max-w-sm">
 No hay trabajadores que coincidan con tu búsqueda o filtros actuales.
 </p>
 </div>
 );
 }

 return (
 <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-muted">
 {workers.map((worker) => (
 <WorkerSelectableRow
 key={worker.id}
 worker={worker}
 isSelected={selectedIds.has(worker.id)}
 onToggle={() => onToggleWorker(worker.id)}
 isAlreadyInCrew={existingWorkerIds.includes(worker.id)}
 crew={crew}
 canReassign={canReassign}
 />
 ))}
 </div>
 );
}
