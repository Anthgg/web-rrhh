"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, EyeOff, CheckCircle2, UsersRound, MapPin, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState, LoadingPanel } from "@/components/shared/states";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { workCrewsService, type WorkCrew } from "@/services/work-crews.service";
import { extractArray } from "@/lib/utils/extract-array";
import { WorkCrewFormModal } from "./components/WorkCrewFormModal";
import { FileText, FileSpreadsheet } from "lucide-react";
import { WorkersByLocationView } from "./components/WorkersByLocationView";
import { WorkCrewsReportBuilder } from "./components/WorkCrewsReportBuilder";
import { CorporateExportModal } from "./components/CorporateExportModal";

import { WorkTeamStats } from "./components/WorkTeamStats";
import { WorkTeamFilters } from "./components/WorkTeamFilters";
import { WorkTeamsTabs } from "./components/WorkTeamsTabs";
import { type AdvancedFiltersState } from "./components/AdvancedFiltersPopover";
import { useRouter } from "next/navigation";

const columns = (
  onEdit: (crew: WorkCrew) => void,
  onView: (crew: WorkCrew) => void,
  onToggle: (crew: WorkCrew) => void,
  isPending: boolean
) => [
  {
    key: "name",
    header: "Cuadrilla",
    render: (crew: WorkCrew) => (
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
          <UsersRound className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-bold text-slate-900">{crew.name}</p>
          <p className="truncate text-xs text-slate-500 max-w-[200px]" title={crew.description}>
            {crew.description || "Sin descripción"}
          </p>
        </div>
      </div>
    ),
  },
  {
    key: "supervisor",
    header: "Supervisor",
    render: (crew: WorkCrew) => (
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-slate-700">{crew.supervisor_name || "Sin supervisor"}</span>
        {crew.supervisor_email && (
          <span className="text-xs text-slate-500">{crew.supervisor_email}</span>
        )}
      </div>
    ),
  },
  {
    key: "location",
    header: "Obra Principal",
    render: (crew: WorkCrew) => (
      <div className="flex items-start gap-2">
        <div className="mt-0.5 p-1 bg-slate-100 rounded-md">
          <MapPin className="size-3.5 shrink-0 text-slate-500" />
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="truncate text-sm font-semibold text-slate-700 max-w-[180px]">
            {crew.work_location_name || "Sin obra"}
          </span>
          {crew.work_location_address && (
            <span className="truncate text-[11px] text-slate-500 max-w-[180px]" title={crew.work_location_address}>
              {crew.work_location_address}
            </span>
          )}
        </div>
      </div>
    ),
  },
  {
    key: "workers",
    header: "Trabajadores",
    render: (crew: WorkCrew) => {
      const total = crew.active_workers_count ?? 0;
      // Mocked breakdown assuming backend doesn't provide it yet
      // In a real scenario we'd use crew.main_location_workers and crew.temp_moved_workers
      const temp = 0; 
      const main = total - temp;

      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
            {total} {total === 1 ? 'trabajador' : 'trabajadores'}
          </div>
          {total > 0 && (
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-500"></span>
                {main} en obra
              </span>
              {temp > 0 && (
                <span className="flex items-center gap-1 text-amber-600">
                  <span className="size-1.5 rounded-full bg-amber-500"></span>
                  {temp} movidos
                </span>
              )}
            </div>
          )}
        </div>
      );
    },
  },
  {
    key: "status",
    header: "Estado",
    render: (crew: WorkCrew) => <StatusBadge status={crew.is_active ? "active" : "inactive"} />,
  },
  {
    key: "actions",
    header: "Acciones",
    className: "text-right",
    render: (crew: WorkCrew) => (
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="secondary"
          className="h-8 px-3 text-indigo-600 bg-indigo-50 border-indigo-100 hover:bg-indigo-100 hover:text-indigo-700 font-semibold text-xs rounded-lg"
          onClick={() => onView(crew)}
        >
          Ver Detalle
        </Button>
        <Button
          variant="ghost"
          className="size-8 p-0 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-lg"
          onClick={() => onEdit(crew)}
          title="Editar"
        >
          <Edit2 className="size-4" />
        </Button>
        <Button
          variant="ghost"
          className={`size-8 p-0 rounded-lg ${
            crew.is_active ? "text-amber-500 hover:bg-amber-50" : "text-emerald-500 hover:bg-emerald-50"
          }`}
          onClick={() => onToggle(crew)}
          disabled={isPending}
          title={crew.is_active ? "Desactivar" : "Activar"}
        >
          {crew.is_active ? <EyeOff className="size-4" /> : <CheckCircle2 className="size-4" />}
        </Button>
      </div>
    ),
  },
];

export function WorkCrewsWorkspace({ hideHeader }: { hideHeader?: boolean }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCrew, setSelectedCrew] = useState<WorkCrew | null>(null);
  const [viewMode, setViewMode] = useState<"crews" | "locations" | "reports">("crews");
  const [isExportPdfOpen, setIsExportPdfOpen] = useState(false);
  const [isExportExcelOpen, setIsExportExcelOpen] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFiltersState>({
    supervisor: "",
    workLocation: "",
    movedWorkersOnly: false,
  });

  const crewsQuery = useQuery({
    queryKey: ["work-crews"],
    queryFn: async () => {
      const data = await workCrewsService.getWorkCrews();
      return extractArray<WorkCrew>(data);
    },
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      workCrewsService.updateWorkCrewStatus(id, is_active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["work-crews"] }),
  });

  if (crewsQuery.isLoading) return <div className="h-[60vh] flex items-center justify-center"><LoadingPanel title="Cargando panel de cuadrillas..." /></div>;

  if (crewsQuery.isError || !crewsQuery.data) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <ErrorState
          title="No pudimos cargar las cuadrillas"
          description="Hubo un problema al contactar con el servidor."
          onRetry={() => void crewsQuery.refetch()}
        />
      </div>
    );
  }

  const rawRows = Array.isArray(crewsQuery.data)
    ? crewsQuery.data
    : (crewsQuery.data as any)?.items ?? (crewsQuery.data as any)?.data ?? [];

  // Frontend Filtering
  const filteredRows = rawRows.filter((crew: WorkCrew) => {
    // 1. Status Filter
    if (statusFilter === "active" && !crew.is_active) return false;
    if (statusFilter === "inactive" && crew.is_active) return false;

    // 2. Assignment Filter (Mock implementation depending on properties available)
    if (assignmentFilter === "none" && crew.work_location_id) return false;
    if (assignmentFilter === "main" && !crew.work_location_id) return false;
    // ... we map other filters as needed if backend provides the data in the WorkCrew list

    // 3. Advanced Filters
    if (advancedFilters.supervisor) {
      if (!crew.supervisor_name?.toLowerCase().includes(advancedFilters.supervisor.toLowerCase())) return false;
    }
    if (advancedFilters.workLocation) {
      if (!crew.work_location_name?.toLowerCase().includes(advancedFilters.workLocation.toLowerCase())) return false;
    }
    if (advancedFilters.movedWorkersOnly) {
      // Mock logic: assuming crew.total_movements > 0 represents moved workers or we just enforce it
      if (!crew.total_movements || crew.total_movements === 0) return false;
    }

    // 4. Search Query Filter
    if (!searchQuery) return true;
    const lowerQ = searchQuery.toLowerCase();
    return (
      crew.name.toLowerCase().includes(lowerQ) ||
      (crew.supervisor_name?.toLowerCase().includes(lowerQ)) ||
      (crew.work_location_name?.toLowerCase().includes(lowerQ)) ||
      (crew.description?.toLowerCase().includes(lowerQ))
    );
  });

  const activeReportFilters = {
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: searchQuery || undefined,
  };

  const reportTableColumns = [
    { key: "name", label: "Cuadrilla" },
    { key: "supervisor_name", label: "Supervisor" },
    { key: "work_location_name", label: "Obra Principal" },
    { key: "active_workers_count", label: "Trabajadores" },
    { key: "is_active", label: "Estado" },
  ];

  const reportTableData = filteredRows.map((crew: WorkCrew) => ({
    name: crew.name,
    supervisor_name: crew.supervisor_name || "Sin supervisor",
    work_location_name: crew.work_location_name || "Sin obra",
    active_workers_count: crew.active_workers_count ?? 0,
    is_active: crew.is_active ? "Activo" : "Inactivo",
  }));

  const handleCreate = () => {
    setSelectedCrew(null);
    setIsFormOpen(true);
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className={`flex flex-col gap-4 sm:flex-row sm:items-center ${hideHeader ? "sm:justify-end" : "sm:justify-between"} mb-6`}>
        {!hideHeader && (
          <PageHeader
            eyebrow="Operaciones"
            title="Equipos de Trabajo"
            description="Gestiona las cuadrillas, supervisores, obras asignadas y movimientos laborales."
          />
        )}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {viewMode !== "reports" && (
            <>
              <Button variant="secondary" onClick={() => setIsExportExcelOpen(true)} className="gap-2 rounded-xl h-10 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800">
                <FileSpreadsheet className="size-4" />
                <span className="hidden sm:inline font-medium">Exportar Excel</span>
              </Button>
              <Button variant="secondary" onClick={() => setIsExportPdfOpen(true)} className="gap-2 rounded-xl h-10 border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800">
                <FileText className="size-4" />
                <span className="hidden sm:inline font-medium">Exportar PDF</span>
              </Button>
            </>
          )}
          <Button onClick={handleCreate} className="gap-2 rounded-xl h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm">
            <Plus className="size-4" />
            Nueva Cuadrilla
          </Button>
        </div>
      </div>

      <WorkTeamStats crews={rawRows} />

      <WorkTeamFilters 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        assignmentFilter={assignmentFilter}
        setAssignmentFilter={setAssignmentFilter}
        advancedFilters={advancedFilters}
        setAdvancedFilters={setAdvancedFilters}
      />

      <WorkTeamsTabs 
        viewMode={viewMode} 
        setViewMode={setViewMode} 
        crewsCount={filteredRows.length} 
      />

      {viewMode === "crews" ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex-1">
          {filteredRows.length > 0 ? (
            <DataTable
              columns={columns(
                (crew) => { setSelectedCrew(crew); setIsFormOpen(true); },
                (crew) => router.push(`/equipos-de-trabajo/${crew.id}`), 
                (crew) => toggleStatus.mutate({ id: crew.id, is_active: !crew.is_active }), 
                toggleStatus.isPending
              )}
              rows={filteredRows}
              rowKey={(item: any) => item.id as string}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-16 text-slate-400">
              <UsersRound className="size-16 mb-4 text-slate-200" />
              <p className="text-lg font-bold text-slate-900">No se encontraron resultados</p>
              <p className="text-sm mt-1 mb-6 text-slate-500">Intenta cambiando los filtros o la bÃºsqueda actual.</p>
              <Button variant="secondary" onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setAssignmentFilter("all");
                setAdvancedFilters({ supervisor: "", workLocation: "", movedWorkersOnly: false });
              }}>
                Limpiar todos los filtros
              </Button>
            </div>
          )}
        </div>
      ) : viewMode === "locations" ? (
        <WorkersByLocationView 
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          assignmentFilter={assignmentFilter}
          advancedFilters={advancedFilters}
          setSearchQuery={setSearchQuery}
        />
      ) : (
        <WorkCrewsReportBuilder />
      )}

      {/* Modals */}
      <WorkCrewFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        crewData={selectedCrew}
      />
      <CorporateExportModal
        isOpen={isExportPdfOpen}
        onClose={() => setIsExportPdfOpen(false)}
        reportType="work-crews"
        exportFormat="pdf"
        activeFilters={activeReportFilters}
        tableData={reportTableData}
        tableColumns={reportTableColumns}
        tableSummary={{ total: reportTableData.length }}
        filename="reporte-equipos-trabajo.pdf"
      />
      <CorporateExportModal
        isOpen={isExportExcelOpen}
        onClose={() => setIsExportExcelOpen(false)}
        reportType="work-crews"
        exportFormat="excel"
        activeFilters={activeReportFilters}
        tableData={reportTableData}
        tableColumns={reportTableColumns}
        tableSummary={{ total: reportTableData.length }}
        filename="reporte-equipos-trabajo.xlsx"
        onDownload={({ filters, customData }) =>
          workCrewsService.downloadReport("excel", {
            filters,
            columns: customData?.columns.map((column) => column.key) ?? reportTableColumns.map((column) => column.key),
            customData,
            page: 1,
            pageSize: 1000,
          })
        }
      />
    </div>
  );
}
