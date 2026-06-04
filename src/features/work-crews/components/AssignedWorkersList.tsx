import { Users, Trash2, CalendarClock, User as UserIcon, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getSafeWorkerId, getSafeUserId } from "@/lib/api/worker-ids";

interface AssignedWorkersListProps {
  workers: any[];
  onViewLocation: (workerId: string) => void;
  onRemoveWorker: (workerId: string, workerName: string) => void;
  isRemoving: boolean;
}

export function AssignedWorkersList({ workers, onViewLocation, onRemoveWorker, isRemoving }: AssignedWorkersListProps) {
  if (!workers || workers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border border-dashed border-slate-300 rounded-xl mt-4">
        <Users className="size-10 text-slate-300 mb-3" />
        <p className="text-slate-500 font-medium text-center">No hay trabajadores asignados a esta cuadrilla.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-slate-100">
      {workers.map((w: any) => {
        const workerName = w.worker_name || `${w.first_name || ""} ${w.last_name || ""}`.trim() || "Trabajador Desconocido";
        const workerId = getSafeWorkerId(w);
        const userId = getSafeUserId(w);
        const isComplete = Boolean(workerId);
        const workerContact = w.worker_email || w.email || w.personal_id || "Sin datos de contacto";

        return (
          <div key={workerId || userId || Math.random().toString()} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 hover:bg-slate-50 transition-colors gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-slate-50 text-slate-400 shrink-0 border border-slate-100">
                <Users className="size-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-slate-900 truncate">{workerName}</span>
                <span className="text-sm text-slate-500 truncate">{workerContact}</span>
                {!isComplete ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700 w-fit mt-1">
                    Perfil incompleto
                  </span>
                ) : w.active_assignment?.source === "temporary_assignment" || w.active_assignment?.source === "individual_temporary_location_assignment" ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 w-fit mt-1">
                    <CalendarClock className="size-3" />
                    Movido Temporal a {w.active_assignment.work_location_name || "Otra obra"}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700 w-fit mt-1">
                    <Users className="size-3" />
                    En Obra Principal
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {isComplete ? (
                <>
                  <Link
                    className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                    href={`/trabajadores/${workerId}`}
                    title="Ver perfil del trabajador"
                  >
                    <UserIcon className="size-3.5 mr-1.5" />
                    Perfil
                  </Link>
                  <Button
                    variant="secondary"
                    className="h-9 rounded-xl border-indigo-100 bg-indigo-50/50 px-3 text-indigo-600 hover:border-indigo-200 hover:bg-indigo-100"
                    onClick={() => onViewLocation(workerId!)}
                    title="Ver ubicación activa / historial"
                  >
                    <CalendarClock className="size-3.5 mr-1.5" />
                    Ubicación
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-9 rounded-xl px-3 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    onClick={() => onRemoveWorker(workerId!, workerName)}
                    disabled={isRemoving}
                    title="Retirar de cuadrilla"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </>
              ) : userId ? (
                <Link
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                  href={`/trabajadores/alta?mode=complete&userId=${userId}`}
                  title="Completar ficha laboral"
                >
                  <UserPlus className="size-3.5 mr-1.5" />
                  Completar ficha
                </Link>
              ) : (
                <span className="text-xs text-red-500 font-medium">Perfil incompleto</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
