import { useState } from "react";
import { UsersRound, FileText, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssignedWorkersTable } from "./AssignedWorkersTable";
import { LoadingPanel } from "@/components/shared/states";
import type { CrewWorkerItem } from "@/types";

interface AssignedWorkersSectionProps {
 crewId: string;
 workers: CrewWorkerItem[];
 isLoading: boolean;
 onAddWorkers: () => void;
 onExportPdf: () => void;
 onExportExcel: () => void;
 onViewLocation: (id: string) => void;
 onRemoveWorker: (id: string, name: string) => void;
 isRemoving: boolean;
}

export function AssignedWorkersSection({
 crewId,
 workers,
 isLoading,
 onAddWorkers,
 onExportPdf,
 onExportExcel,
 onViewLocation,
 onRemoveWorker,
 isRemoving
}: AssignedWorkersSectionProps) {
 const [workerTab, setWorkerTab] = useState<"all" | "main" | "temp">("all");

 const mainWorkers = workers.filter(w => !w.active_assignment || w.active_assignment.source === "crew_location" || w.active_assignment.source === "direct_worker_location");
 const tempWorkers = workers.filter(w => w.active_assignment?.source === "temporary_assignment");

 const filteredWorkers = workerTab === "all" ? workers : workerTab === "main" ? mainWorkers : tempWorkers;

 return (
 <div className="flex flex-col gap-6 mt-8">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h3 className="text-xl font-bold text-foreground">Trabajadores Asignados</h3>
 <p className="text-sm text-muted-foreground mt-1">Control de trabajadores pertenecientes a la cuadrilla y su ubicación laboral actual</p>
 </div>
 <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
 <Button variant="secondary" title="Exportar PDF" onClick={onExportPdf} className="h-10 w-10 shrink-0 rounded-xl border-rose-200 p-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700">
 <FileText className="size-4" />
 </Button>
 <Button variant="secondary" title="Exportar Excel" onClick={onExportExcel} className="h-10 w-10 shrink-0 rounded-xl border-emerald-200 p-0 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700">
 <FileSpreadsheet className="size-4" />
 </Button>
 <Button className="h-10 gap-2 shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm" onClick={onAddWorkers}>
 <UsersRound className="size-4" />
 Asignar Trabajadores
 </Button>
 </div>
 </div>

 <div className="flex items-center gap-1 bg-muted p-1.5 rounded-xl w-fit">
 <button 
 type="button"
 onClick={() => setWorkerTab("all")} 
 className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${workerTab === "all" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-slate-200"}`}
 >
 Todos ({workers.length})
 </button>
 <button 
 type="button"
 onClick={() => setWorkerTab("main")} 
 className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${workerTab === "main" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-slate-200"}`}
 >
 Obra Principal ({mainWorkers.length})
 </button>
 <button 
 type="button"
 onClick={() => setWorkerTab("temp")} 
 className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${workerTab === "temp" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-slate-200"}`}
 >
 Movidos ({tempWorkers.length})
 </button>
 </div>

 {isLoading ? (
 <LoadingPanel title="Cargando trabajadores..." />
 ) : (
 <AssignedWorkersTable 
 crewId={crewId}
 workers={filteredWorkers}
 onViewLocation={onViewLocation}
 onRemoveWorker={onRemoveWorker}
 isRemoving={isRemoving}
 />
 )}
 </div>
 );
}
