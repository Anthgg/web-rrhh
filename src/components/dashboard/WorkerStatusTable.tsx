import { StatusBadge } from "@/components/dashboard/StatusBadge";

export interface WorkerStatus {
 attendanceId: string;
 workerId: string;
 workerName: string;
 projectName: string;
 checkIn: string | null;
 checkOut: string | null;
 status: string;
 lateMinutes: number;
}

function formatTime(isoString: string | null | undefined): string {
 if (!isoString) return "--:--";
 try {
 const date = new Date(isoString);
 if (isNaN(date.getTime())) return isoString;
 return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
 } catch {
 return isoString;
 }
}

export function WorkerStatusTable({ workers }: { workers: WorkerStatus[] }) {
 return (
 <div className="overflow-hidden rounded-3xl border border-border bg-card">
 <div className="hidden grid-cols-[1.2fr_.8fr_.7fr_.7fr_.7fr] gap-4 border-b border-border bg-muted px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground md:grid">
 <span>Trabajador</span>
 <span>Proyecto</span>
 <span>Entrada</span>
 <span>Salida</span>
 <span>Estado</span>
 </div>
 <div className="divide-y divide-border">
 {workers.map((worker, idx) => (
 <div
 key={worker.attendanceId || worker.workerId || `worker-${idx}`}
 className="grid gap-3 p-4 text-sm md:grid-cols-[1.2fr_.8fr_.7fr_.7fr_.7fr] md:items-center md:gap-4"
 >
 <div className="grid gap-1">
 <strong className="font-semibold text-foreground">{worker.workerName}</strong>
 {worker.lateMinutes > 0 && (
 <span className="text-xs text-destructive font-medium">Tardanza: {worker.lateMinutes}m</span>
 )}
 </div>
 <span className="text-muted-foreground">{worker.projectName || "--"}</span>
 <span className="font-mono text-foreground">{formatTime(worker.checkIn)}</span>
 <span className="font-mono text-foreground">{worker.checkOut ? formatTime(worker.checkOut) : "Pendiente"}</span>
 <StatusBadge status={worker.status} />
 </div>
 ))}
 </div>
 </div>
 );
}

