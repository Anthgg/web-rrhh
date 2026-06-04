"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { workCrewsService, CrewWorker } from "@/services/work-crews.service";
import { extractArray } from "@/lib/utils/extract-array";
import { getSafeWorkerId } from "@/lib/api/worker-ids";

import { LoadingPanel, ErrorState } from "@/components/shared/states";
import { ExportReportModal } from "@/components/reports/ExportReportModal";

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

export function WorkCrewDetailView({ crewId }: WorkCrewDetailViewProps) {
  const queryClient = useQueryClient();

  const [isChangeLocationOpen, setIsChangeLocationOpen] = useState(false);
  const [isAddWorkersOpen, setIsAddWorkersOpen] = useState(false);
  const [isExportPdfOpen, setIsExportPdfOpen] = useState(false);
  const [isExportExcelOpen, setIsExportExcelOpen] = useState(false);
  const [workerStatusId, setWorkerStatusId] = useState<string | null>(null);

  const crewQuery = useQuery({
    queryKey: ["work-crews", crewId],
    queryFn: () => workCrewsService.getWorkCrew(crewId),
  });

  const workersQuery = useQuery({
    queryKey: ["work-crews", crewId, "workers"],
    queryFn: () => workCrewsService.getWorkCrewWorkers(crewId),
  });

  const removeWorkerMutation = useMutation({
    mutationFn: (workerId: string) => workCrewsService.removeWorkerFromCrew(crewId, workerId, "Retiro de cuadrilla"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["work-crews", crewId, "workers"] }),
  });

  const crew = (crewQuery.data as any)?.data ?? crewQuery.data;
  const workers = extractArray<CrewWorker>(workersQuery.data);

  const mainWorkers = workers.filter(w => !w.active_assignment || w.active_assignment.source === "crew_location" || w.active_assignment.source === "direct_worker_location");
  const tempWorkers = workers.filter(w => w.active_assignment && (w.active_assignment.source === "temporary_assignment" || w.active_assignment.source === "individual_temporary_location_assignment"));

  let expiredCount = 0;
  tempWorkers.forEach(w => {
    if (w.active_assignment?.end_date) {
      const endDate = new Date(w.active_assignment.end_date);
      endDate.setHours(23, 59, 59, 999);
      if (endDate < new Date()) expiredCount++;
    }
  });

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

  if (crewQuery.isLoading) {
    return <div className="h-full w-full flex items-center justify-center bg-slate-50"><LoadingPanel title="Cargando detalles de la cuadrilla..." /></div>;
  }

  if (crewQuery.isError) {
    return <div className="h-full w-full flex items-center justify-center bg-slate-50"><ErrorState title="Error" description="No se pudo cargar la cuadrilla." onRetry={() => crewQuery.refetch()} /></div>;
  }

  const mapWorkerRow = (w: CrewWorker) => {
    const isTransferred = w.active_assignment?.source === "temporary_assignment" || w.active_assignment?.source === "individual_temporary_location_assignment";
    const statusLabel = isTransferred ? "Transferido (Temporal)" : "Obra Principal";
    const locationName = w.active_assignment?.work_location_name || crew?.work_location_name || "Sin obra";
    const assignedDate = "-";
    const assignedTime = "-";
    const temporaryEndDate = "-";
    const temporaryEndTime = "-";
    const name = `${w.first_name} ${w.last_name}`;

    return {
      worker_name: name,
      worker_document: w.personal_id,
      email: w.email,
      assignment_status: statusLabel,
      current_location_name: locationName,
      assigned_date: assignedDate,
      assigned_time: assignedTime,
      temporary_end_date: temporaryEndDate,
      temporary_end_time: temporaryEndTime,
      isTransferred,
    };
  };

  const pdfFilters = {
    crew_id: crewId,
    assignment_type: undefined,
  };
  
  const pdfFilterLabels = {
    crew_id: crew?.name || crewId,
    assignment_type: "Todos",
  };

  const pdfTableColumns = [
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

  const pdfTableData = workers.map((worker) => mapWorkerRow(worker));

  return (
    <div className="flex flex-col min-h-full bg-slate-50/50 pb-12">
      {/* 1. Header */}
      <WorkTeamHeader 
        crew={crew} 
        onExportPdf={() => setIsExportPdfOpen(true)} 
        onExportExcel={() => setIsExportExcelOpen(true)} 
      />

      {/* 2. Summary Cards */}
      <WorkTeamSummaryCards 
        totalWorkers={workers.length}
        inMainLocation={mainWorkers.length}
        tempMoved={tempWorkers.length}
        expiredAssignments={expiredCount}
        totalMovements={crew?.total_movements ?? 0}
        lastUpdated={lastUpdatedAt}
      />

      <div className="px-4 md:px-6 xl:px-8 py-6 w-full flex-1 flex flex-col gap-6 max-w-none">
        {/* 3. Supervisor & Work Location Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SupervisorInfoCard crew={crew} />
          <MainWorkLocationCard crew={crew} onChangeLocation={() => setIsChangeLocationOpen(true)} />
        </div>

        {/* 4. Full Width Map */}
        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm h-[320px] relative">
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
          isLoading={workersQuery.isLoading}
          onAddWorkers={() => setIsAddWorkersOpen(true)}
          onExportPdf={() => setIsExportPdfOpen(true)}
          onExportExcel={() => setIsExportExcelOpen(true)}
          onViewLocation={setWorkerStatusId}
          onRemoveWorker={(id, name) => {
            if (window.confirm(`¿Retirar a ${name} de esta cuadrilla?`)) {
              removeWorkerMutation.mutate(id);
            }
          }}
          isRemoving={removeWorkerMutation.isPending}
        />
      </div>

      {/* Modals */}
      {isChangeLocationOpen && (
        <ChangeCrewLocationModal
          isOpen={isChangeLocationOpen}
          onClose={() => setIsChangeLocationOpen(false)}
          crew={crew!}
        />
      )}
      {isAddWorkersOpen && (
        <AddWorkersToCrewModal
          isOpen={isAddWorkersOpen}
          onClose={() => setIsAddWorkersOpen(false)}
          crew={crew!}
          existingWorkerIds={workers.map((w: CrewWorker) => getSafeWorkerId(w)).filter(Boolean) as string[]}
        />
      )}
      {workerStatusId && (
        <WorkerLocationStatusModal
          isOpen={!!workerStatusId}
          onClose={() => setWorkerStatusId(null)}
          workerId={workerStatusId}
        />
      )}
      <ExportReportModal
        isOpen={isExportPdfOpen}
        onClose={() => setIsExportPdfOpen(false)}
        reportType="work-crews"
        activeFilters={pdfFilters}
        activeFilterLabels={pdfFilterLabels}
        tableData={pdfTableData}
        tableColumns={pdfTableColumns}
        tableSummary={{ total: pdfTableData.length, crew: crew?.name }}
        filename={`movimientos-cuadrilla-${crew?.name || "reporte"}.pdf`}
      />
      <ExportReportModal
        isOpen={isExportExcelOpen}
        onClose={() => setIsExportExcelOpen(false)}
        reportType="work-crews"
        exportFormat="excel"
        activeFilters={pdfFilters}
        activeFilterLabels={pdfFilterLabels}
        tableData={pdfTableData}
        tableColumns={pdfTableColumns}
        tableSummary={{ total: pdfTableData.length, crew: crew?.name }}
        filename={`movimientos-cuadrilla-${crew?.name || "reporte"}.xlsx`}
        onDownload={({ filters, customData }) =>
          workCrewsService.downloadReport("excel", {
            filters,
            columns: customData?.columns.map((column) => column.key) ?? pdfTableColumns.map((column) => column.key),
            customData,
            page: 1,
            pageSize: 1000,
          })
        }
      />
    </div>
  );
}
