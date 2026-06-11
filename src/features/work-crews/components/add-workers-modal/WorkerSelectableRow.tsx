import { User, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { WorkerRecord } from "@/types";
import { isUuid } from "@/lib/api/worker-ids";
import { WorkCrew } from "@/services/work-crews.service";

interface WorkerSelectableRowProps {
 worker: WorkerRecord;
 isSelected: boolean;
 onToggle: () => void;
 isAlreadyInCrew: boolean;
 crew: WorkCrew;
 canReassign?: boolean;
}

export function WorkerSelectableRow({ worker, isSelected, onToggle, isAlreadyInCrew, crew, canReassign = false }: WorkerSelectableRowProps) {
 // A worker is occupied if they are in another crew, or if they are assigned to a different project/work location.
 const isOccupied =
 (worker as any).isBusy === true ||
 (worker as any).assignmentStatus === "busy" ||
 (worker as any).assignmentStatus === "assigned" ||
 (!!worker.work_location_id && worker.work_location_id !== crew.work_location_id) ||
 (!!worker.project && worker.project !== crew.work_location_name) ||
 (!!worker.crew_id && worker.crew_id !== crew.id);

 const isInactive = worker.status === "inactive";
 const isComplete = isUuid(worker.id);
 
 const isDisabled = isAlreadyInCrew || isInactive || !isComplete || (isOccupied && !canReassign);

 let badgeColor = "bg-emerald-100 text-emerald-700";
 let badgeIcon = <CheckCircle2 className="size-3" />;
 let badgeText = "Disponible";

 if (!isComplete) {
 badgeColor = "bg-rose-100 text-rose-700";
 badgeIcon = <XCircle className="size-3" />;
 badgeText = "Perfil Incompleto";
 } else if (isAlreadyInCrew) {
 badgeColor = "bg-muted text-muted-foreground";
 badgeIcon = <CheckCircle2 className="size-3" />;
 badgeText = "Ya en cuadrilla";
 } else if (isInactive) {
 badgeColor = "bg-muted text-muted-foreground";
 badgeIcon = <XCircle className="size-3" />;
 badgeText = "Inactivo";
 } else if (isOccupied) {
 badgeColor = "bg-amber-100 text-amber-700";
 badgeIcon = <AlertTriangle className="size-3" />;
 badgeText = "Ocupado";
 }

 return (
 <label
 className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
 isDisabled ? "opacity-60 bg-muted border-transparent cursor-not-allowed" : "cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/50"
 } ${isSelected ? "border-indigo-600 bg-indigo-50/30" : "border-border bg-card"}`}
 >
 <div className="flex shrink-0 items-center justify-center pl-1">
 <input
 type="checkbox"
 className="size-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 disabled:opacity-50 cursor-pointer"
 checked={isSelected}
 disabled={isDisabled}
 onChange={() => {
 if (!isDisabled) {
 onToggle();
 }
 }}
 />
 </div>

 <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground shrink-0">
 <User className="size-5" />
 </div>

 <div className="flex flex-col min-w-0 flex-1">
 <span className="text-sm font-bold text-foreground truncate">
 {worker.fullName}
 </span>
 <span className="text-xs text-muted-foreground truncate">
 {(!worker.position || worker.position.toLowerCase() === "no informado" || worker.position.toLowerCase() === "sin cargo") 
 ? ((worker as any).personal_id ? `DNI: ${(worker as any).personal_id} • ` : "") 
 : `${worker.position} • `}
 {worker.email || "Sin correo"}
 </span>
 {!isAlreadyInCrew && !isInactive && (worker.work_location_name || worker.project) && (
 <span className={`text-[10px] truncate mt-0.5 ${isOccupied ? "text-amber-600" : "text-emerald-600 font-medium"}`}>
 {isOccupied ? "Actualmente en: " : "Obra asignada: "}{worker.work_location_name || worker.project}
 {worker.crew_name ? ` (${worker.crew_name})` : ""}
 </span>
 )}
 {isOccupied && !canReassign && (
 <span className="text-[10px] text-rose-500 font-semibold mt-0.5 leading-relaxed">
 Solo su supervisor actual, RR.HH. o un administrador puede moverlo.
 </span>
 )}
 </div>

 <div className="shrink-0 pl-2">
 <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${badgeColor}`}>
 {badgeIcon}
 {badgeText}
 </div>
 </div>
 </label>
 );
}
