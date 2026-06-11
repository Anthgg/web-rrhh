"use client";

import { useReducer } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { workCrewsService } from "@/services/work-crews.service";
import type { CrewWorkerItem } from "@/types";
import { extractArray } from "@/lib/utils/extract-array";
import { getSafeWorkerId } from "@/lib/api/worker-ids";

import { LoadingPanel, ErrorState } from "@/components/shared/states";
import { ExportReportModal } from "@/components/reports/ExportReportModal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

import { WorkTeamHeader } from "./components/detail/WorkTeamHeader";
import { WorkTeamSummaryCards } from "./components/detail/WorkTeamSummaryCards";
import { SupervisorInfoCard } from "./components/detail/SupervisorInfoCard";
import { MainWorkLocationCard } from "./components/detail/MainWorkLocationCard";
import { AssignedWorkersSection } from "./components/detail/AssignedWorkersSection";
import { LocationMapPreview } from "./components/LocationMapPreview";

import { ChangeCrewLocationModal } from "./components/ChangeCrewLocationModal";
import { AddWorkersToCrewModal } from "./components/AddWorkersToCrewModal";
import { WorkerLocationStatusModal } from "./components/WorkerLocationStatusModal";

interface WorkCrewDetailViewProps {
 crewId: string;
}

interface WorkCrewDetailState {
 isChangeLocationOpen: boolean;
 isAddWorkersOpen: boolean;
 isExportPdfOpen: boolean;
 isExportExcelOpen: boolean;
 workerStatusId: string | null;
 workerToRemove: { id: string; name: string } | null;
}

const initialWorkCrewDetailState: WorkCrewDetailState = {
 isChangeLocationOpen: false,
 isAddWorkersOpen: false,
 isExportPdfOpen: false,
 isExportExcelOpen: false,
 workerStatusId: null,
 workerToRemove: null,
};

const PDF_TABLE_COLUMNS = [
 { key: "worker_name", label: "Trabajador" },
 { key: "worker_document", label: "Documento" },
 { key: "email", label: "Email" },
 { key: "assignment_status", label: "Estado asignacion" },
 { key: "current_location_name", label: "Obra actual" },
 { key: "assigned_date", label: "Fecha ingreso" },
 { key: "assigned_time", label: "Hora ingreso" },
 { key: "temporary_end_date", label: "Fecha fin" },
 { key: "temporary_end_time", label: "Hora fin" },
];

const mapWorkerRow = (w: CrewWorkerItem) => {
 const isTransferred = w.active_assignment?.source === "temporary_assignment";
 const statusLabel = isTransferred ? "Transferido (Temporal)" : "Obra Principal";
 const locationName = w.active_assignment?.work_location_name || "Sin obra";
 const assignedDate = "-";
 const assignedTime = "-";
 const temporaryEndDate = w.active_assignment?.end_date ? new Date(w.active_assignment.end_date).toLocaleDateString() : "-";
 const temporaryEndTime = "-";
 const name = w.worker_name;

 return {
 worker_name: name,
 worker_document: w.document_number || "S/D",
 email: w.email || "",
 assignment_status: statusLabel,
 current_location_name: locationName,
 assigned_date: assignedDate,
 assigned_time: assignedTime,
 temporary_end_date: temporaryEndDate,
 temporary_end_time: temporaryEndTime,
 isTransferred,
 };
};

export function WorkCrewDetailView({ crewId }: WorkCrewDetailViewProps) {
 const queryClient = useQueryClient();

 const [state, setState] = useReducer(
 (current: WorkCrewDetailState, values: Partial<WorkCrewDetailState>) => ({ ...current, ...values }),
 initialWorkCrewDetailState,
 );
 const { isChangeLocationOpen, isAddWorkersOpen, isExportPdfOpen, isExportExcelOpen, workerStatusId, workerToRemove } = state;

 const {
 data: crewResponse,
 isError: isCrewError,
 isLoading: isCrewLoading,
 refetch: refetchCrew,
 } = useQuery({
 queryKey: ["work-crews", crewId],
 queryFn: () => workCrewsService.getWorkCrew(crewId),
 });

 const {
 data: workersResponse,
 isLoading: isLoadingWorkers,
 } = useQuery({
 queryKey: ["work-crews", crewId, "workers"],
 queryFn: () => workCrewsService.getWorkCrewWorkers(crewId),
 });


 const removeWorkerMutation = useMutation({
 mutationFn: (workerId: string) => workCrewsService.removeWorkerFromCrew(crewId, workerId, "Retiro de cuadrilla"),
 onSuccess: () => queryClient.invalidateQueries({ queryKey: ["work-crews", crewId, "workers"] }),
 });

 const crew = (crewResponse as { data?: typeof crewResponse } | undefined)?.data ?? crewResponse;
 const workers = extractArray<CrewWorkerItem>(workersResponse);

 const mainWorkers = workers.filter(w => !w.active_assignment || w.active_assignment.source === "crew_location" || w.active_assignment.source === "direct_worker_location");
 const tempWorkers = workers.filter(w => w.active_assignment?.source === "temporary_assignment");

 const lastUpdatedAt = crew?.last_updated_at
 ? new Date(crew.last_updated_at).toLocaleString("es-PE", {
 timeZone: "America/Lima",
 day: "2-digit",
 month: "2-digit",
 year: "numeric",
 hour: "2-digit",
 minute: "2-digit",
 }).replace(",", "")
 : "-";




 if (isCrewLoading) {
 return <div className="h-full w-full flex items-center justify-center bg-muted"><LoadingPanel title="Cargando detalles de la cuadrilla..." /></div>;
 }

 if (isCrewError) {
 return <div className="h-full w-full flex items-center justify-center bg-muted"><ErrorState title="Error" description="No se pudo cargar la cuadrilla." onRetry={() => refetchCrew()} /></div>;
 }



 const pdfFilters = {
 crew_id: crewId,
 assignment_type: undefined,
 };

 const pdfFilterLabels = {
 crew_id: crew?.name || crewId,
 assignment_type: "Todos",
 };

 const pdfTableData = workers.map((worker) => mapWorkerRow(worker));
 const handleConfirmRemoveWorker = () => {
 if (!workerToRemove) return;
 removeWorkerMutation.mutate(workerToRemove.id, {
 onSuccess: () => setState({ workerToRemove: null }),
 });
 };

 return (
 <div className="flex flex-col min-h-full bg-muted/50 pb-12">
 {/* 1. Header */}
 <WorkTeamHeader 
 crew={crew} 
 onExportPdf={() => setState({ isExportPdfOpen: true })}
 onExportExcel={() => setState({ isExportExcelOpen: true })}
 />

 {/* 2. Summary Cards */}
 <WorkTeamSummaryCards 
 totalWorkers={workers.length}
 inMainLocation={mainWorkers.length}
 tempMoved={tempWorkers.length}
 totalMovements={crew?.total_movements ?? 0}
 lastUpdated={lastUpdatedAt}
 />

 <div className="px-4 md:px-6 xl:px-8 py-6 w-full flex-1 flex flex-col gap-6 max-w-none">
 {/* 3. Supervisor & Work Location Info */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 <SupervisorInfoCard crew={crew} />
 <MainWorkLocationCard crew={crew} onChangeLocation={() => setState({ isChangeLocationOpen: true })} />
 </div>

 {/* 4. Full Width Map */}
 <div className="rounded-2xl border border-border overflow-hidden bg-card shadow-sm h-[320px] relative">
 <LocationMapPreview 
 location={crew?.work_location_latitude ? {
 name: crew.work_location_name || "",
 address: crew.work_location_address || "",
 latitude: crew.work_location_latitude,
 longitude: crew.work_location_longitude!,
 allowed_radius_meters: crew.allowed_radius_meters || 100,
 } : undefined}
 />
 </div>

 {/* 5. Assigned Workers Section (Table & Tabs) */}
 <AssignedWorkersSection
 crewId={crewId}
 workers={workers}
 isLoading={isLoadingWorkers}
 onAddWorkers={() => setState({ isAddWorkersOpen: true })}
 onExportPdf={() => setState({ isExportPdfOpen: true })}
 onExportExcel={() => setState({ isExportExcelOpen: true })}
 onViewLocation={(workerStatusId) => setState({ workerStatusId })}
 onRemoveWorker={(id, name) => setState({ workerToRemove: { id, name } })}
 isRemoving={removeWorkerMutation.isPending}
 />
 </div>

 {/* Modals */}
 {isChangeLocationOpen && (
 <ChangeCrewLocationModal
 isOpen={isChangeLocationOpen}
 onClose={() => setState({ isChangeLocationOpen: false })}
 crew={crew!}
 />
 )}
 {isAddWorkersOpen && (
 <AddWorkersToCrewModal
 isOpen={isAddWorkersOpen}
 onClose={() => setState({ isAddWorkersOpen: false })}
 crew={crew!}
 existingWorkerIds={workers.flatMap((worker: CrewWorkerItem) => {
 const workerId = worker.worker_id || worker.id;
 return workerId ? [workerId] : [];
 })}
 />
 )}
 {workerStatusId && (
 <WorkerLocationStatusModal
 isOpen={!!workerStatusId}
 onClose={() => setState({ workerStatusId: null })}
 workerId={workerStatusId}
 />
 )}
 <ExportReportModal
 isOpen={isExportPdfOpen}
 onClose={() => setState({ isExportPdfOpen: false })}
 reportType="work-crews"
 activeFilters={pdfFilters}
 activeFilterLabels={pdfFilterLabels}
 tableData={pdfTableData}
 tableColumns={PDF_TABLE_COLUMNS}
 tableSummary={{ total: pdfTableData.length, crew: crew?.name }}
 filename={`movimientos-cuadrilla-${crew?.name || "reporte"}.pdf`}
 />
 <ExportReportModal
 isOpen={isExportExcelOpen}
 onClose={() => setState({ isExportExcelOpen: false })}
 reportType="work-crews"
 exportFormat="excel"
 activeFilters={pdfFilters}
 activeFilterLabels={pdfFilterLabels}
 tableData={pdfTableData}
 tableColumns={PDF_TABLE_COLUMNS}
 tableSummary={{ total: pdfTableData.length, crew: crew?.name }}
 filename={`movimientos-cuadrilla-${crew?.name || "reporte"}.xlsx`}
 onDownload={({ filters, customData }) =>
 workCrewsService.downloadReport("excel", {
 filters,
 columns: customData?.columns.map((column) => column.key) ?? PDF_TABLE_COLUMNS.map((column) => column.key),
 customData,
 page: 1,
 pageSize: 1000,
 })
 }
 />
 <ConfirmDialog
 open={Boolean(workerToRemove)}
 title="Retirar trabajador"
 description={workerToRemove ? `Retirar a ${workerToRemove.name} de esta cuadrilla?` : undefined}
 confirmLabel="Retirar"
 variant="danger"
 isLoading={removeWorkerMutation.isPending}
 onCancel={() => setState({ workerToRemove: null })}
 onConfirm={handleConfirmRemoveWorker}
 />
 </div>
 );
}
