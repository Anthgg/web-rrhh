import { Users, User as UserIcon, CalendarClock, MapPin, Trash2 } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getSafeWorkerId, getSafeUserId } from "@/lib/api/worker-ids";
import type { CrewWorkerItem } from "@/types";

interface AssignedWorkersTableProps {
 crewId: string;
 workers: CrewWorkerItem[];
 onViewLocation: (workerId: string) => void;
 onRemoveWorker: (workerId: string, workerName: string) => void;
 isRemoving: boolean;
}

const formatDate = (dateStr: string | null | undefined) => {
 if (!dateStr) return "";
 const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
 if (match) {
 return `${match[3]}/${match[2]}/${match[1]}`;
 }
 const date = new Date(dateStr);
 if (Number.isNaN(date.getTime())) return "N/A";
 return `${String(date.getUTCDate()).padStart(2, '0')}/${String(date.getUTCMonth() + 1).padStart(2, '0')}/${date.getUTCFullYear()}`;
};

const getAssignmentTooltip = (assignment: any) => {
 if (!assignment) return "Traslado temporal vigente";
 const start = formatDate(assignment.start_date);
 const end = formatDate(assignment.end_date);
 const reason = assignment.reason;

 if (start && end && reason) {
 return `Traslado del ${start} al ${end} · ${reason}`;
 }
 return "Traslado temporal vigente";
};

export function AssignedWorkersTable({ crewId, workers, onViewLocation, onRemoveWorker, isRemoving }: AssignedWorkersTableProps) {
 if (!workers || workers.length === 0) {
 return (
 <div className="flex flex-col items-center justify-center py-12 px-4 bg-card border border-dashed border-slate-300 rounded-2xl">
 <Users className="size-12 text-slate-300 mb-4" />
 <h3 className="text-lg font-bold text-foreground mb-1">Esta cuadrilla aún no tiene trabajadores asignados.</h3>
 <p className="text-sm text-muted-foreground text-center max-w-md">
 Añade trabajadores a esta cuadrilla para empezar a gestionar sus ubicaciones y movimientos.
 </p>
 </div>
 );
 }

 return (
 <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
 <div className="overflow-x-auto">
 <table className="w-full text-sm text-left">
 <thead className="bg-muted text-muted-foreground font-medium border-b border-border">
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
 {workers.map((w: CrewWorkerItem, idx: number) => {
 const workerName = w.worker_name || "Trabajador Desconocido";
 const workerId = w.worker_id || w.id;
 const userId = w.id;
 const isComplete = Boolean(w.worker_id);
 const document = w.document_number || "S/D";
 const contact = w.email || w.phone || "Sin contacto";
 
 const isTemp = w.active_assignment?.source === "temporary_assignment";
 
 const startDate = w.active_assignment?.start_date;
 const endDate = w.active_assignment?.end_date;

 return (
 <tr key={workerId || userId || String(idx)} className="hover:bg-muted transition-colors">
 <td className="px-6 py-4">
 <div className="flex items-center gap-3">
 <UserAvatar
 src={w.avatarUrl}
 fullName={workerName}
 email={w.email}
 size="sm"
 />
 <div className="flex flex-col min-w-0">
 <span className="font-semibold text-foreground truncate">{workerName}</span>
 <span className="text-xs text-muted-foreground truncate">{contact}</span>
 </div>
 </div>
 </td>
 <td className="px-6 py-4 text-muted-foreground">
 {document}
 </td>
 <td className="px-6 py-4">
 {!isComplete ? (
 <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-100 text-rose-700 w-fit">
 Perfil incompleto
 </span>
 ) : isTemp ? (
 <span 
 className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-700 w-fit cursor-help" 
 title={getAssignmentTooltip(w.active_assignment)}
 >
 <CalendarClock className="size-3.5" />
 Movido Temporal
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
 <span className="font-medium text-foreground truncate max-w-[200px]" title={w.active_assignment?.work_location_name || "Obra de cuadrilla"}>
 {w.active_assignment?.work_location_name || "Obra de cuadrilla"}
 </span>
 {isTemp && (
 <span className="text-xs text-muted-foreground">Origen: {w.crew_name || "Cuadrilla"}</span>
 )}
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="flex flex-col text-xs text-muted-foreground">
 <span>{startDate ? formatDate(startDate) : "N/A"}</span>
 {isTemp && (
 <span className="text-muted-foreground">
 hasta {endDate ? formatDate(endDate) : "N/A"}
 </span>
 )}
 </div>
 </td>
 <td className="px-6 py-4 text-right">
 <div className="flex items-center justify-end gap-1.5">
 {isComplete ? (
 <>
 <Link href={`/trabajadores/${workerId}`} className="inline-flex items-center justify-center h-8 px-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors" title="Ver perfil">
 <UserIcon className="size-4" />
 </Link>
 {isTemp && w.active_assignment.assignment_id !== null && (
 <Button 
 variant="ghost" 
 onClick={() => {
 // TODO: integrar cancelación de traslado cuando backend exponga endpoint.
 onViewLocation(workerId!);
 }}
 className="h-8 px-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
 title="Ver detalle traslado"
 >
 <CalendarClock className="size-4" />
 </Button>
 )}
 <Button variant="ghost" onClick={() => onViewLocation(workerId!)} className="h-8 px-2 text-muted-foreground hover:text-foreground" title="Ubicación y movimientos">
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
