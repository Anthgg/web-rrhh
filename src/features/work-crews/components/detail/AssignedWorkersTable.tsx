import { Users, User as UserIcon, CalendarClock, MapPin, Trash2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getSafeWorkerId, getSafeUserId } from "@/lib/api/worker-ids";

interface AssignedWorkersTableProps {
  crewId: string;
  workers: any[];
  onViewLocation: (workerId: string) => void;
  onRemoveWorker: (workerId: string, workerName: string) => void;
  isRemoving: boolean;
}

export function AssignedWorkersTable({ crewId, workers, onViewLocation, onRemoveWorker, isRemoving }: AssignedWorkersTableProps) {
  if (!workers || workers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 bg-white border border-dashed border-slate-300 rounded-2xl">
        <Users className="size-12 text-slate-300 mb-4" />
        <h3 className="text-lg font-bold text-slate-900 mb-1">Esta cuadrilla aún no tiene trabajadores asignados.</h3>
        <p className="text-sm text-slate-500 text-center max-w-md">
          Añade trabajadores a esta cuadrilla para empezar a gestionar sus ubicaciones y movimientos.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 whitespace-nowrap">Trabajador</th>
              <th className="px-6 py-4 whitespace-nowrap">Documento</th>
              <th className="px-6 py-4 whitespace-nowrap">Estado</th>
              <th className="px-6 py-4 whitespace-nowrap">Obra Actual</th>
              <th className="px-6 py-4 whitespace-nowrap">Fechas</th>
              <th className="px-6 py-4 whitespace-nowrap text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {workers.map((w: any) => {
              const workerName = w.worker_name || `${w.first_name || ""} ${w.last_name || ""}`.trim() || "Trabajador Desconocido";
              const workerId = getSafeWorkerId(w);
              const userId = getSafeUserId(w);
              const isComplete = Boolean(workerId);
              const document = w.personal_id || "S/D";
              const contact = w.email || w.phone || "Sin contacto";
              
              const isTemp = w.active_assignment?.source === "temporary_assignment" || w.active_assignment?.source === "individual_temporary_location_assignment";
              const isReceived = isTemp && w.crew_id !== crewId;
              
              // Determine if expired
              let isExpired = false;
              if (isTemp && w.active_assignment?.end_date) {
                const endDate = new Date(w.active_assignment.end_date);
                endDate.setHours(23, 59, 59, 999);
                if (endDate < new Date()) {
                  isExpired = true;
                }
              }

              const startDate = w.assigned_at || w.active_assignment?.start_date;
              const endDate = w.active_assignment?.end_date;

              return (
                <tr key={workerId || userId || Math.random().toString()} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 shrink-0">
                        <UserIcon className="size-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-slate-900 truncate">{workerName}</span>
                        <span className="text-xs text-slate-500 truncate">{contact}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {document}
                  </td>
                  <td className="px-6 py-4">
                    {!isComplete ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-100 text-rose-700 w-fit">
                        Perfil incompleto
                      </span>
                    ) : isExpired ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-100 text-rose-700 w-fit">
                        <ShieldAlert className="size-3.5" />
                        Asignación Vencida
                      </span>
                    ) : isReceived ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-100 text-amber-700 w-fit" title={`Su cuadrilla base es: ${w.crew_name || 'Otra cuadrilla'}`}>
                        <CalendarClock className="size-3.5" />
                        Apoyo Temporal
                      </span>
                    ) : isTemp ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-700 w-fit" title={`Enviado a: ${w.active_assignment?.work_location_name || 'Otra obra'}`}>
                        <CalendarClock className="size-3.5" />
                        Movido a Otra Obra
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700 w-fit">
                        <MapPin className="size-3.5" />
                        En Obra Principal
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900 truncate max-w-[200px]" title={w.active_assignment?.work_location_name || "Obra de cuadrilla"}>
                        {w.active_assignment?.work_location_name || "Obra de cuadrilla"}
                      </span>
                      {isTemp && (
                        <span className="text-xs text-slate-500">Origen: {w.crew_name || "Cuadrilla"}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col text-xs text-slate-600">
                      <span>{startDate ? new Date(startDate).toLocaleDateString() : "N/A"}</span>
                      {isTemp && (
                        <span className={isExpired ? "text-rose-600 font-semibold" : "text-slate-400"}>
                          hasta {endDate ? new Date(endDate).toLocaleDateString() : "N/A"}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {isComplete ? (
                        <>
                          <Link href={`/trabajadores/${workerId}`} className="inline-flex items-center justify-center h-8 px-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors" title="Ver perfil">
                            <UserIcon className="size-4" />
                          </Link>
                          <Button variant="ghost" onClick={() => onViewLocation(workerId!)} className="h-8 px-2 text-slate-500 hover:text-slate-700" title="Ubicación y movimientos">
                            <MapPin className="size-4" />
                          </Button>
                          <Button variant="ghost" onClick={() => onRemoveWorker(workerId!, workerName)} disabled={isRemoving} className="h-8 px-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50" title="Quitar de cuadrilla">
                            <Trash2 className="size-4" />
                          </Button>
                        </>
                      ) : userId ? (
                        <Link href={`/trabajadores/alta?mode=complete&userId=${userId}`} className="inline-flex items-center justify-center h-8 px-2.5 text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-md transition-colors font-semibold" title="Completar ficha">
                          Completar ficha
                        </Link>
                      ) : (
                        <span className="text-xs text-rose-600">Perfil incompleto</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
