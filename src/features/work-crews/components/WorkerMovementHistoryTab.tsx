import { useQuery } from "@tanstack/react-query";
import { workersService, WorkerAssignmentHistory } from "@/services/workers.service";
import { extractArray } from "@/lib/utils/extract-array";
import { LoadingPanel, ErrorState } from "@/components/shared/states";
import { FileText, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToPDF } from "@/lib/utils/export-reports";

export function WorkerMovementHistoryTab({ workerId }: { workerId: string }) {
  const historyQuery = useQuery({
    queryKey: ["worker-location-history", workerId],
    queryFn: () => workersService.getWorkerLocationHistory(workerId),
  });

  if (historyQuery.isLoading) return <LoadingPanel title="Cargando historial..." />;
  if (historyQuery.isError) return <ErrorState title="Error" description="No se pudo cargar el historial" onRetry={() => historyQuery.refetch()} />;

  const history = extractArray<WorkerAssignmentHistory>(historyQuery.data);

  if (!history || history.length === 0) {
    return <div className="text-center p-6 border border-dashed border-slate-300 rounded-xl text-slate-500">No hay movimientos registrados en el historial.</div>;
  }

  const handleExportPDF = () => {
    const columns = ["Fecha", "Tipo de Movimiento", "Detalle", "Motivo"];
    const rows = history.map(r => [
      new Date(r.changed_at).toLocaleString(),
      r.change_type,
      r.new_work_location_name || r.new_crew_name || "N/A",
      r.reason || ""
    ]);
    exportToPDF("Historial de Movimientos", columns, rows, `historial_${workerId}`);
  };

  const typeLabels: Record<string, string> = {
    temporary_assignment_created: "Movimiento temporal",
    permanent_assignment_created: "Movimiento permanente",
    worker_added_to_crew: "Ingreso a cuadrilla",
    worker_moved_crew: "Cambio de cuadrilla",
    worker_removed_from_crew: "Retiro de cuadrilla",
    crew_work_location_changed: "Cambio de obra base de cuadrilla",
    individual_location_assignment_cancelled: "Movimiento cancelado",
  };

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-xs text-slate-500 font-medium">Movimientos</p>
            <p className="text-xl font-bold text-slate-900">{history.length}</p>
          </div>
          <div className="w-px bg-slate-200" />
          <div>
            <p className="text-xs text-slate-500 font-medium">Último movimiento</p>
            <p className="text-sm font-medium text-slate-900 mt-1">{new Date(history[0]?.changed_at).toLocaleDateString()}</p>
          </div>
        </div>
        <Button variant="secondary" onClick={handleExportPDF} className="h-9 gap-2 rounded-xl bg-white px-3">
          <FileText className="size-4 text-rose-600" />
          Exportar PDF
        </Button>
      </div>

      <div className="relative border-l-2 border-slate-200 ml-4 py-2 space-y-8">
        {history.map((r: WorkerAssignmentHistory, idx: number) => {
          const isLatest = idx === 0;
          return (
            <div key={`${r.changed_at}-${idx}`} className="relative pl-6">
              <div className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-4 border-white ${isLatest ? "bg-indigo-600" : "bg-slate-300"}`} />
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div>
                  <h4 className={`font-semibold flex items-center gap-2 ${isLatest ? "text-indigo-900" : "text-slate-800"}`}>
                    {typeLabels[r.change_type] || r.change_type.replace(/_/g, " ")}
                    {r.change_type.includes("temporary") && <CalendarClock className="size-3 text-amber-600" />}
                  </h4>
                  <p className="text-sm text-slate-600 mt-0.5">
                    {r.new_work_location_name ? `Obra: ${r.new_work_location_name}` : r.new_crew_name ? `Cuadrilla: ${r.new_crew_name}` : "Cambio de estado"}
                  </p>
                  {(r.start_date || r.end_date) && (
                    <p className="text-xs text-slate-500 mt-1">
                      {r.start_date && `Desde: ${new Date(r.start_date).toLocaleDateString()}`}
                      {r.start_date && r.end_date && " - "}
                      {r.end_date && `Hasta: ${new Date(r.end_date).toLocaleDateString()}`}
                    </p>
                  )}
                  {r.reason && <p className="text-xs text-slate-500 mt-1 italic">"{r.reason}"</p>}
                  {r.changed_by_name && <p className="text-xs text-slate-400 mt-1">Por: {r.changed_by_name}</p>}
                </div>
                <span className="text-xs font-medium text-slate-500 whitespace-nowrap bg-slate-100 px-2 py-1 rounded-md">
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
