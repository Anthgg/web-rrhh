"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { BriefcaseBusiness, Eye, FileText, UserPlus, ChevronDown } from "lucide-react";
import Link from "next/link";

import { useSession } from "@/features/auth/auth-provider";

import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { ErrorState, LoadingPanel } from "@/components/shared/states";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { FieldFrame, Input, Select } from "@/components/ui/fields";
import { ExportReportModal } from "@/components/reports/ExportReportModal";
import { RequestModalShell } from "@/components/requests/request-modal-shell";
import { workersService } from "@/services/workers.service";
import type { WorkerRecord } from "@/types";
import { WorkerContractsTable } from "@/features/workers/worker-contracts-table";
import { useDownloadWorkerLocationHistoryPdf } from "@/hooks/useDownloadWorkerLocationHistoryPdf";
import { isUuid } from "@/services/reports.service";
import { getSafeWorkerId, getSafeUserId, isWorkerProfileComplete } from "@/lib/api/worker-ids";
import { RoleBadge } from "@/lib/ui/role-badges";

const workerColumnsForExport = [
 { key: "fullName", label: "Trabajador" },
 { key: "email", label: "Correo Electrónico" },
 { key: "role", label: "Rol / cargo" },
 { key: "position", label: "Puesto" },
 { key: "project", label: "Proyecto" },
 { key: "department", label: "Área" },
 { key: "status", label: "Estado" },
 { key: "phone", label: "Contacto" },
];

function WorkerIdentityCell({ worker }: { worker: WorkerRecord }) {
 const isComplete = isWorkerProfileComplete(worker);
 return (
 <div className="flex items-center gap-3">
 <UserAvatar
 src={worker.avatarUrl}
 fullName={worker.fullName}
 email={worker.email}
 size="sm"
 />
 <div className="grid gap-0.5 text-left">
 <strong className="font-semibold text-foreground leading-tight block">
 {worker.fullName}
 </strong>
 {worker.email ? (
 <span className="text-xs text-muted-foreground block max-w-[180px] truncate" title={worker.email}>
 {worker.email}
 </span>
 ) : null}
 <div className="flex items-center gap-2 mt-0.5">
 {worker.documentNumber ? (
 <span className="text-xs text-muted-foreground font-medium">
 DNI: {worker.documentNumber}
 </span>
 ) : null}
 {worker.documentNumber && <span className="text-slate-300 text-[10px]">•</span>}
 <span
 className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
 isComplete
 ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
 : "bg-amber-50 text-amber-700 border border-amber-100"
 }`}
 >
 {isComplete ? "Ficha completa" : "Ficha incompleta"}
 </span>
 </div>
 </div>
 </div>
 );
}

function WorkerRoleCell({ worker }: { worker: WorkerRecord }) {
 const displayRole = worker.roleName || worker.roleCode || worker.role;
 return (
 <div className="space-y-1 text-left">
 {displayRole ? (
 <RoleBadge roleName={worker.roleName} roleCode={worker.roleCode || worker.role} />
 ) : (
 <span className="text-xs text-muted-foreground font-medium italic">Sin rol</span>
 )}
 <p className="font-semibold text-foreground text-sm">
 {worker.positionName || "Sin cargo asignado"}
 </p>
 <p className="text-xs text-muted-foreground">
 {worker.areaName ? `Área: ${worker.areaName}` : "Sin área asignada"}
 </p>
 </div>
 );
}

function WorkerProjectCell({ worker }: { worker: WorkerRecord }) {
 return (
 <div className="space-y-1 text-left">
 <p className="text-sm font-semibold text-foreground">
 {worker.workLocationName || "Sin obra asignada"}
 </p>
 <p className="text-xs text-muted-foreground">
 {worker.crewName ? `Cuadrilla: ${worker.crewName}` : "Sin cuadrilla"}
 </p>
 </div>
 );
}

function WorkerStatusCell({ worker }: { worker: WorkerRecord }) {
 const hasObra = Boolean(worker.work_location_id || worker.workLocationName || worker.project);
 const isComplete = isWorkerProfileComplete(worker);

 let laborStatusClass = "bg-muted text-foreground border-border";
 let laborLabel = "Inactivo";
 if (worker.status === "active") {
 laborStatusClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
 laborLabel = "Activo";
 } else if (worker.status === "on-leave") {
 laborStatusClass = "bg-amber-50 text-amber-700 border-amber-200";
 laborLabel = "Licencia";
 }

 return (
 <div className="flex flex-col gap-1 w-fit text-left">
 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border w-fit ${laborStatusClass}`}>
 {laborLabel}
 </span>
 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border w-fit ${
 isComplete
 ? "bg-emerald-50 text-emerald-700 border-emerald-100"
 : "bg-amber-50 text-amber-700 border-amber-100"
 }`}>
 {isComplete ? "Completo" : "Incompleto"}
 </span>
 {!hasObra && (
 <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-rose-50 text-rose-700 border-rose-100 w-fit">
 Sin obra
 </span>
 )}
 </div>
 );
}

function WorkerContactCell({ worker }: { worker: WorkerRecord }) {
 return (
 <div className="grid gap-0.5 text-xs text-muted-foreground text-left">
 <p className="font-medium text-foreground">
 {worker.phone ? `Tel: ${worker.phone}` : "Teléfono no registrado"}
 </p>
 <p className="truncate max-w-[180px]" title={worker.email}>
 {worker.email ? worker.email : "Correo no registrado"}
 </p>
 </div>
 );
}

function WorkerRowActions({
 worker,
 onShowContracts,
 downloadHistoryPdf,
}: {
 worker: WorkerRecord;
 onShowContracts: (w: WorkerRecord) => void;
 downloadHistoryPdf: any;
}) {
 const [isOpen, setIsOpen] = useState(false);
 const dropdownRef = useRef<HTMLDivElement>(null);

 const workerId = getSafeWorkerId(worker);
 const userId = getSafeUserId(worker);
 const isValidWorkerId = workerId && isUuid(workerId);

 const isRowDownloading =
 downloadHistoryPdf.isPending &&
 downloadHistoryPdf.variables?.workerId === workerId;

 useEffect(() => {
 function handleClickOutside(event: MouseEvent) {
 if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
 setIsOpen(false);
 }
 }
 document.addEventListener("mousedown", handleClickOutside);
 return () => {
 document.removeEventListener("mousedown", handleClickOutside);
 };
 }, []);

 if (!isValidWorkerId && userId) {
 return (
 <Link href={`/trabajadores/alta?mode=complete&userId=${userId}`}>
 <Button
 type="button"
 variant="secondary"
 className="h-9 gap-1.5 px-3 text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-xl"
 >
 <UserPlus className="size-3.5" />
 Completar ficha
 </Button>
 </Link>
 );
 }

 if (!isValidWorkerId) {
 return (
 <span className="text-xs text-muted-foreground italic font-medium px-2 py-1">
 Sin acciones disponibles
 </span>
 );
 }

 return (
 <div className="relative inline-flex items-center gap-1.5" ref={dropdownRef}>
 {/* Primary Action Button */}
 <Link href={`/trabajadores/${workerId}`}>
 <Button
 type="button"
 variant="secondary"
 className="h-9 gap-1.5 px-3 text-xs rounded-xl"
 >
 <Eye className="size-3.5" />
 Perfil
 </Button>
 </Link>

 {/* Dropdown Toggle */}
 <Button
 type="button"
 variant="secondary"
 onClick={() => setIsOpen(!isOpen)}
 className="h-9 px-2 text-xs flex items-center justify-center rounded-xl"
 aria-label="Más acciones"
 disabled={isRowDownloading}
 >
 <ChevronDown className="size-3.5" />
 </Button>

 {/* Dropdown Menu */}
 {isOpen && (
 <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border border-border bg-card py-1 shadow-lg z-50 animate-in fade-in slide-in-from-top-1 duration-100">
 <button
 type="button"
 onClick={() => {
 setIsOpen(false);
 onShowContracts(worker);
 }}
 className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-foreground hover:bg-muted transition"
 >
 <BriefcaseBusiness className="size-3.5 text-muted-foreground" />
 Ver contratos
 </button>

 <button
 type="button"
 disabled={downloadHistoryPdf.isPending}
 onClick={() => {
 setIsOpen(false);
 downloadHistoryPdf.mutate({ workerId });
 }}
 className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50 transition"
 >
 <FileText className="size-3.5 text-rose-600" />
 {isRowDownloading ? "Descargando..." : "Historial PDF"}
 </button>
 </div>
 )}
 </div>
 );
}

export function WorkersWorkspace() {
 const [filters, setFilters] = useState({
 page: 1,
 search: "",
 status: "",
 project: "",
 });
 const [isExportModalOpen, setIsExportModalOpen] = useState(false);
 const [contractsWorker, setContractsWorker] = useState<WorkerRecord | null>(null);
 const { user } = useSession();
 const downloadHistoryPdf = useDownloadWorkerLocationHistoryPdf();

 const {
 data: workersData,
 isError: isWorkersError,
 isLoading: isWorkersLoading,
 refetch: refetchWorkers,
 } = useQuery({
 queryKey: ["workers", filters.page, filters.search, filters.status, filters.project],
 queryFn: () =>
 workersService.list({
 page: filters.page,
 pageSize: 8,
 search: filters.search || undefined,
 status: filters.status || undefined,
 project: filters.project || undefined,
 }),
 });

 const columns: Column<WorkerRecord>[] = [
 {
 key: "worker",
 header: "Trabajador",
 render: (item) => <WorkerIdentityCell worker={item} />,
 },
 {
 key: "role",
 header: "Rol / Cargo / Área",
 render: (item) => <WorkerRoleCell worker={item} />,
 },
 {
 key: "project",
 header: "Proyecto / Obra / Cuadrilla",
 render: (item) => <WorkerProjectCell worker={item} />,
 },
 {
 key: "status",
 header: "Estado",
 render: (item) => <WorkerStatusCell worker={item} />,
 },
 {
 key: "contact",
 header: "Contacto",
 render: (item) => <WorkerContactCell worker={item} />,
 },
 {
 key: "actions",
 header: "Acciones",
 className: "text-right",
 render: (item) => (
 <WorkerRowActions
 worker={item}
 onShowContracts={setContractsWorker}
 downloadHistoryPdf={downloadHistoryPdf}
 />
 ),
 },
 ];

 const filteredItems = useMemo(() => {
 const items = workersData?.items;
 if (!items) return [];
 const term = filters.search.trim().toLowerCase();
 if (!term) return items;

 return items.filter((worker) => {
 const searchable = [
 worker.fullName,
 worker.documentNumber,
 worker.email,
 worker.roleName,
 worker.roleCode,
 worker.positionName,
 worker.areaName,
 worker.workLocationName,
 worker.crewName,
 ]
 .filter(Boolean)
 .join(" ")
 .toLowerCase();

 return searchable.includes(term);
 });
 }, [workersData?.items, filters.search]);

 if (isWorkersLoading) {
 return <LoadingPanel title="Cargando equipo y trabajadores." />;
 }

 if (isWorkersError || !workersData) {
 return (
 <ErrorState
 title="No pudimos cargar trabajadores"
 description="El módulo está listo para filtrar por proyecto o estado cuando la API final exponga esos parámetros."
 onRetry={() => void refetchWorkers()}
 />
 );
 }

 const data = workersData;

 return (
 <>
 <PageHeader
 eyebrow="Equipo"
 title="Trabajadores"
 description="Vista limpia y administrativa del personal con filtros por estado y proyecto."
 action={
 <div className="flex gap-3">
 {(user?.role === "admin" || user?.role === "hr" || user?.role === "super_admin") && (
 <Link href="/trabajadores/alta">
 <Button className="rounded-xl bg-indigo-600 font-medium text-white hover:bg-indigo-700 h-10 px-4 flex items-center gap-1.5 shadow-sm shadow-indigo-15">
 <UserPlus className="size-4" />
 Alta Colaborador
 </Button>
 </Link>
 )}
 <Button
 variant="secondary"
 className="rounded-xl border-border hover:bg-muted"
 onClick={() => setIsExportModalOpen(true)}
 >
 <FileText className="mr-2 size-4 text-muted-foreground" />
 Exportar PDF
 </Button>
 </div>
 }
 />

 <Card className="grid gap-4">
 <div className="grid gap-3 lg:grid-cols-[1.1fr_0.5fr_0.6fr]">
 <FieldFrame label="Buscar">
 <Input
 value={filters.search}
 placeholder="Buscar por nombre, DNI, correo, rol, cargo, obra o cuadrilla..."
 onChange={(event) => {
 setFilters((prev) => ({ ...prev, search: event.target.value, page: 1 }));
 }}
 />
 </FieldFrame>
 <FieldFrame label="Estado">
 <Select
 value={filters.status}
 onChange={(event) => {
 setFilters((prev) => ({ ...prev, status: event.target.value, page: 1 }));
 }}
 >
 <option value="">Todos</option>
 <option value="active">Activo</option>
 <option value="inactive">Inactivo</option>
 <option value="on-leave">Licencia</option>
 </Select>
 </FieldFrame>
 <FieldFrame label="Proyecto">
 <Input
 value={filters.project}
 placeholder="Ej. Obra Norte"
 onChange={(event) => {
 setFilters((prev) => ({ ...prev, project: event.target.value, page: 1 }));
 }}
 />
 </FieldFrame>
 </div>

 <DataTable columns={columns} rows={filteredItems} rowKey={(item) => item.id} />
 <PaginationControls
 page={data.page}
 pageSize={data.pageSize}
 total={data.total}
 onPageChange={(p) => setFilters((prev) => ({ ...prev, page: p }))}
 />
 </Card>

 <ExportReportModal
 isOpen={isExportModalOpen}
 onClose={() => setIsExportModalOpen(false)}
 reportType="workers"
 activeFilters={{
 status: filters.status ? filters.status.toUpperCase() : undefined, // Convert to matching ACTIVE/INACTIVE if uppercase
 project: filters.project || undefined,
 search: filters.search || undefined
 }}
 tableData={data.items}
 tableColumns={workerColumnsForExport}
 filename="reporte-colaboradores-fabryor"
 />

 <RequestModalShell
 isOpen={Boolean(contractsWorker)}
 title="Contratos"
 subtitle={contractsWorker ? contractsWorker.fullName : undefined}
 onClose={() => setContractsWorker(null)}
 size="xl"
 >
 {contractsWorker ? <WorkerContractsTable workerId={getSafeWorkerId(contractsWorker) || ""} /> : null}
 </RequestModalShell>
 </>
 );
}
