import { User, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { WorkerRecord } from "@/types";
import { isUuid } from "@/lib/api/worker-ids";

interface WorkerSelectableRowProps {
  worker: WorkerRecord;
  isSelected: boolean;
  onToggle: () => void;
  isAlreadyInCrew: boolean;
}

export function WorkerSelectableRow({ worker, isSelected, onToggle, isAlreadyInCrew }: WorkerSelectableRowProps) {
  // If the worker has a work_location_id, they are considered "Ocupados" for this UI
  // Note: we'd ideally rely on `crew_id` or `active_assignment` if available
  const isOccupied = !!worker.work_location_id || !!worker.project;
  const isInactive = worker.status === "inactive";
  const isComplete = isUuid(worker.id);
  
  const isDisabled = isAlreadyInCrew || isInactive || !isComplete;

  let badgeColor = "bg-emerald-100 text-emerald-700";
  let badgeIcon = <CheckCircle2 className="size-3" />;
  let badgeText = "Disponible";

  if (!isComplete) {
    badgeColor = "bg-rose-100 text-rose-700";
    badgeIcon = <XCircle className="size-3" />;
    badgeText = "Perfil Incompleto";
  } else if (isAlreadyInCrew) {
    badgeColor = "bg-slate-100 text-slate-500";
    badgeIcon = <CheckCircle2 className="size-3" />;
    badgeText = "Ya en cuadrilla";
  } else if (isInactive) {
    badgeColor = "bg-slate-100 text-slate-500";
    badgeIcon = <XCircle className="size-3" />;
    badgeText = "Inactivo";
  } else if (isOccupied) {
    badgeColor = "bg-amber-100 text-amber-700";
    badgeIcon = <AlertTriangle className="size-3" />;
    badgeText = "Ocupado";
  }

  return (
    <div
      className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
        isDisabled ? "opacity-60 bg-slate-50 border-transparent cursor-not-allowed" : "cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/50"
      } ${isSelected ? "border-indigo-600 bg-indigo-50/30" : "border-slate-200 bg-white"}`}
      onClick={() => {
        if (!isDisabled) onToggle();
      }}
    >
      <div className="flex shrink-0 items-center justify-center pl-1">
        <input
          type="checkbox"
          className="size-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 disabled:opacity-50 cursor-pointer"
          checked={isSelected}
          disabled={isDisabled}
          onChange={(e) => {
            // onChange is handled by the parent div onClick to make the whole row clickable
          }}
          onClick={(e) => e.stopPropagation()} // Prevent double trigger
        />
      </div>

      <div className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 shrink-0">
        <User className="size-5" />
      </div>

      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-bold text-slate-900 truncate">
          {worker.fullName}
        </span>
        <span className="text-xs text-slate-500 truncate">
          {(!worker.position || worker.position.toLowerCase() === "no informado" || worker.position.toLowerCase() === "sin cargo") 
            ? ((worker as any).personal_id ? `DNI: ${(worker as any).personal_id} • ` : "") 
            : `${worker.position} • `}
          {worker.email || "Sin correo"}
        </span>
        {isOccupied && !isAlreadyInCrew && !isInactive && (
          <span className="text-[10px] text-amber-600 truncate mt-0.5">
            Actualmente en: {worker.work_location_name || worker.project || "Otra ubicación"}
          </span>
        )}
      </div>

      <div className="shrink-0 pl-2">
        <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${badgeColor}`}>
          {badgeIcon}
          {badgeText}
        </div>
      </div>
    </div>
  );
}
