import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { workersService, WorkerAssignmentHistory } from "@/services/workers.service";
import { extractArray } from "@/lib/utils/extract-array";
import { LoadingPanel, ErrorState } from "@/components/shared/states";
import { FileText, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDownloadWorkerLocationHistoryPdf } from "@/hooks/useDownloadWorkerLocationHistoryPdf";
import { isValidDateRange } from "@/services/reports.service";
import { toast } from "sonner";

const typeLabels: Record<string, string> = {
 temporary_assignment_created: "Movimiento temporal",
 permanent_assignment_created: "Movimiento permanente",
 worker_added_to_crew: "Ingreso a cuadrilla",
 worker_moved_crew: "Cambio de cuadrilla",
 worker_removed_from_crew: "Retiro de cuadrilla",
 crew_work_location_changed: "Cambio de obra base de cuadrilla",
 individual_location_assignment_cancelled: "Movimiento cancelado",
};

export function WorkerMovementHistoryTab({ workerId }: { workerId: string }) {
 const [startDate, setStartDate] = useState("");
 const [endDate, setEndDate] = useState("");

 const downloadHistoryPdf = useDownloadWorkerLocationHistoryPdf();

 const {
 data: historyData,
 isError: isHistoryError,
 isLoading: isHistoryLoading,
 refetch: refetchHistory,
 } = useQuery({
 queryKey: ["worker-location-history", workerId],
 queryFn: () => workersService.getWorkerLocationHistory(workerId),
 });

 if (isHistoryLoading) return <LoadingPanel title="Cargando historial..." />;
 if (isHistoryError) return <ErrorState title="Error" description="No se pudo cargar el historial" onRetry={() => refetchHistory()} />;

 const history = extractArray<WorkerAssignmentHistory>(historyData);

 if (!history || history.length === 0) {
 return <div className="text-center p-6 border border-dashed border-slate-300 rounded-xl text-muted-foreground">No hay movimientos registrados en el historial.</div>;
 }

 const handleExportPDF = () => {
 if (!isValidDateRange(startDate || null, endDate || null)) {
 toast.error("El rango de fechas no es válido. Usa el formato YYYY-MM-DD.");
 return;
 }

 downloadHistoryPdf.mutate({
 workerId,
 startDate: startDate || null,
 endDate: endDate || null,
 });
 };

 return (
 <div className="space-y-6">
 {/* Summary Header */}
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 bg-muted rounded-xl border border-border">
 <div className="flex gap-4">
 <div className="text-center">
 <p className="text-xs text-muted-foreground font-medium">Movimientos</p>
 <p className="text-xl font-bold text-foreground">{history.length}</p>
 </div>
 <div className="w-px bg-slate-200" />
 <div>
 <p className="text-xs text-muted-foreground font-medium">Último movimiento</p>
 <p className="text-sm font-medium text-foreground mt-1">{new Date(history[0]?.changed_at).toLocaleDateString()}</p>
 </div>
 </div>

 <div className="flex flex-wrap items-center gap-3">
 <div className="flex items-center gap-2">
 <span className="text-xs font-semibold text-muted-foreground">Desde:</span>
 <input
 type="date"
 value={startDate}
 aria-label="Fecha de inicio"
 onChange={(e) => setStartDate(e.target.value)}
 className="h-9 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
 />
 </div>
 <div className="flex items-center gap-2">
 <span className="text-xs font-semibold text-muted-foreground">Hasta:</span>
 <input
 type="date"
 value={endDate}
 aria-label="Fecha de fin"
 onChange={(e) => setEndDate(e.target.value)}
 className="h-9 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
 />
 </div>
 <Button
 variant="secondary"
 disabled={downloadHistoryPdf.isPending}
 onClick={handleExportPDF}
 className="h-9 gap-2 rounded-xl bg-card px-3"
 >
 <FileText className="size-4 text-rose-600" />
 {downloadHistoryPdf.isPending ? "Generando PDF..." : "Exportar PDF"}
 </Button>
 </div>
 </div>

 <div className="relative border-l-2 border-border ml-4 py-2 space-y-8">
 {history.map((r: WorkerAssignmentHistory, idx: number) => {
 const isLatest = idx === 0;
 return (
 <div key={`${r.changed_at}-${idx}`} className="relative pl-6">
 <div className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-4 border-white ${isLatest ? "bg-indigo-600" : "bg-slate-300"}`} />
 <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
 <div>
 <h4 className={`font-semibold flex items-center gap-2 ${isLatest ? "text-indigo-900" : "text-foreground"}`}>
 {typeLabels[r.change_type] || r.change_type.replace(/_/g, " ")}
 {r.change_type.includes("temporary") && <CalendarClock className="size-3 text-amber-600" />}
 </h4>
 <p className="text-sm text-muted-foreground mt-0.5">
 {r.new_work_location_name ? `Obra: ${r.new_work_location_name}` : r.new_crew_name ? `Cuadrilla: ${r.new_crew_name}` : "Cambio de estado"}
 </p>
 {(r.start_date || r.end_date) && (
 <p className="text-xs text-muted-foreground mt-1">
 {r.start_date && `Desde: ${new Date(r.start_date).toLocaleDateString()}`}
 {r.start_date && r.end_date && " - "}
 {r.end_date && `Hasta: ${new Date(r.end_date).toLocaleDateString()}`}
 </p>
 )}
 {r.reason && <p className="text-xs text-muted-foreground mt-1 italic">"{r.reason}"</p>}
 {r.changed_by_name && <p className="text-xs text-muted-foreground mt-1">Por: {r.changed_by_name}</p>}
 </div>
 <span className="text-xs font-medium text-muted-foreground whitespace-nowrap bg-muted px-2 py-1 rounded-md">
 {new Date(r.changed_at).toLocaleString()}
 </span>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 );
}
