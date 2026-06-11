"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useReducer, useState } from "react";
import { toast } from "sonner";
import { normalizeUserRole } from "@/lib/api/normalizers";
import { SYSTEM_ROLE_STYLES } from "@/lib/ui/role-badges";
import { logger } from "@/lib/logger";

import { PaginationControls } from "@/components/shared/pagination-controls";
import { ErrorState, LoadingPanel } from "@/components/shared/states";
import { usersService } from "@/services/users.service";

import { UsersHeader } from "./components/UsersHeader";
import { UsersStats } from "./components/UsersStats";
import { UsersFilters } from "./components/UsersFilters";
import { UsersTable } from "./components/UsersTable";

type UsersFiltersState = {
 linkStatus: string;
 page: number;
 role: string;
 search: string;
 status: string;
};

type UsersFiltersAction =
 | { type: "page"; value: number }
 | { type: "filter"; key: Exclude<keyof UsersFiltersState, "page">; value: string };

const initialUsersFilters: UsersFiltersState = {
 linkStatus: "",
 page: 1,
 role: "",
 search: "",
 status: "",
};

function usersFiltersReducer(state: UsersFiltersState, action: UsersFiltersAction): UsersFiltersState {
 if (action.type === "page") {
 return { ...state, page: action.value };
 }

 return {
 ...state,
 [action.key]: action.value,
 page: 1,
 };
}

export function UsersWorkspace() {
 const router = useRouter();
 const [filters, dispatchFilters] = useReducer(usersFiltersReducer, initialUsersFilters);
 const { page, search, role, status, linkStatus } = filters;
 const setPage = (value: number) => dispatchFilters({ type: "page", value });
 const setSearch = (value: string) => dispatchFilters({ type: "filter", key: "search", value });
 const setRole = (value: string) => dispatchFilters({ type: "filter", key: "role", value });
 const setStatus = (value: string) => dispatchFilters({ type: "filter", key: "status", value });
 const setLinkStatus = (value: string) => dispatchFilters({ type: "filter", key: "linkStatus", value });
 
 const [isExportingExcel, setIsExportingExcel] = useState(false);
 const [isExportingPdf, setIsExportingPdf] = useState(false);

 const {
 data: usersData,
 isError: isUsersError,
 isLoading: isUsersLoading,
 refetch: refetchUsers,
 } = useQuery({
 queryKey: ["users", page, search, role, status],
 queryFn: () =>
 usersService.list({
 page,
 pageSize: 15, // Increased page size for better table look
 search: search || undefined,
 role: role || undefined,
 status: status || undefined,
 }),
 });

 const getCustomData = () => {
 const items = usersData?.items || [];
 return {
 reportTitle: "REPORTE DE USUARIOS",
 columns: [
 { key: "fullName", label: "Nombre" },
 { key: "email", label: "Correo" },
 { key: "role", label: "Rol" },
 { key: "status", label: "Estado" },
 { key: "position", label: "Cargo" },
 { key: "project", label: "Proyecto" }
 ],
 rows: items.map(u => {
 const normalized = normalizeUserRole(u);
 const roleKey = String(normalized.roleCode ?? normalized.roleName ?? "").toLowerCase();
 const displayRole = SYSTEM_ROLE_STYLES[roleKey]?.label ?? normalized.displayRole;
 const displayPosition = u.worker?.position || (u.role !== "unknown" ? displayRole : normalized.displayRole) || "No informado";

 return {
 fullName: u.fullName,
 email: u.email,
 role: displayRole,
 status: u.status === "active" ? "Activo" : "Inactivo",
 position: displayPosition,
 project: u.worker?.work_location_name || u.supervisedCrew?.work_location_name || "Sin proyecto"
 };
 })
 };
 };

 const handleExportExcel = async () => {
 try {
 setIsExportingExcel(true);
 await usersService.exportExcel({
 search: search || undefined,
 role: role || undefined,
 status: status || undefined,
 }, getCustomData());
 } catch (error) {
 logger.error("Error exporting excel", error);
 toast.error("No se pudo exportar el Excel de usuarios.");
 } finally {
 setIsExportingExcel(false);
 }
 };

 const handleExportPDF = async () => {
 try {
 setIsExportingPdf(true);
 await usersService.exportPdf({
 search: search || undefined,
 role: role || undefined,
 status: status || undefined,
 }, getCustomData());
 } catch (error) {
 logger.error("Error exporting PDF", error);
 toast.error("No se pudo exportar el PDF de usuarios.");
 } finally {
 setIsExportingPdf(false);
 }
 };

 if (isUsersLoading) {
 return <LoadingPanel title="Cargando usuarios administrativos." />;
 }

 if (isUsersError || !usersData) {
 return (
 <ErrorState
 title="No pudimos cargar usuarios"
 description="La vista usa solo GET /api/users. Revisa la sesión o el contrato real del backend."
 onRetry={() => void refetchUsers()}
 />
 );
 }

 const data = usersData;
 // Local filtering for `linkStatus` since API doesn't support it directly
 let filteredItems = data.items;
 if (linkStatus) {
 filteredItems = filteredItems.filter(item => {
 const hasRecord = Boolean(item.hasWorkerRecord);
 if (linkStatus === "with_record") return hasRecord;
 if (linkStatus === "without_record") return !hasRecord;
 const workLocationName = item.worker?.work_location_name || item.supervisedCrew?.work_location_name;
 if (linkStatus === "with_project") return !!workLocationName;
 if (linkStatus === "without_project") return !workLocationName;
 return true;
 });
 }

 return (
 <>
 <div className="flex flex-col gap-6">
 <UsersHeader 
 onExportExcel={handleExportExcel} 
 onExportPDF={handleExportPDF} 
 isExportingExcel={isExportingExcel}
 isExportingPdf={isExportingPdf}
 />

 <UsersStats users={data.items} total={data.total} />

 <UsersFilters
 search={search}
 onSearchChange={setSearch}
 role={role}
 onRoleChange={setRole}
 status={status}
 onStatusChange={setStatus}
 linkStatus={linkStatus}
 onLinkStatusChange={setLinkStatus}
 users={data?.items || []}
 />

 {filteredItems.length === 0 ? (
 <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-12 text-center">
 <h3 className="text-lg font-semibold text-foreground">No se encontraron usuarios</h3>
 <p className="mt-1 text-sm text-foreground-soft">Intenta ajustar los filtros de búsqueda.</p>
 </div>
 ) : (
 <div className="grid gap-4">
 <UsersTable 
 users={filteredItems} 
 onUserClick={(user) => router.push(`/usuarios/${user.id}`)}
 />
 
 <PaginationControls
 page={data.page}
 pageSize={data.pageSize}
 total={data.total}
 onPageChange={setPage}
 />
 </div>
 )}
 </div>
 </>
 );
}
