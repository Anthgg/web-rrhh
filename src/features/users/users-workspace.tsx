"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PaginationControls } from "@/components/shared/pagination-controls";
import { ErrorState, LoadingPanel } from "@/components/shared/states";
import { usersService } from "@/services/users.service";

import { UsersHeader } from "./components/UsersHeader";
import { UsersStats } from "./components/UsersStats";
import { UsersFilters } from "./components/UsersFilters";
import { UsersTable } from "./components/UsersTable";

export function UsersWorkspace() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [linkStatus, setLinkStatus] = useState("");
  
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const usersQuery = useQuery({
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
    const items = usersQuery.data?.items || [];
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
      rows: items.map(u => ({
        fullName: u.fullName,
        email: u.email,
        role: u.role === "admin" ? "Administrador" : u.role === "supervisor" ? "Supervisor" : u.role === "hr" ? "RR.HH." : u.role === "worker" ? "Trabajador" : "No informado",
        status: u.status === "active" ? "Activo" : "Inactivo",
        position: u.worker?.position || u.role || "No informado",
        project: u.worker?.work_location_name || u.supervisedCrew?.work_location_name || "Sin proyecto"
      }))
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
      console.error("Error exporting excel", error);
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
      console.error("Error exporting PDF", error);
    } finally {
      setIsExportingPdf(false);
    }
  };

  if (usersQuery.isLoading) {
    return <LoadingPanel title="Cargando usuarios administrativos." />;
  }

  if (usersQuery.isError || !usersQuery.data) {
    return (
      <ErrorState
        title="No pudimos cargar usuarios"
        description="La vista usa solo GET /api/users. Revisa la sesión o el contrato real del backend."
        onRetry={() => void usersQuery.refetch()}
      />
    );
  }

  const data = usersQuery.data;
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
          onSearchChange={(val) => { setSearch(val); setPage(1); }}
          role={role}
          onRoleChange={(val) => { setRole(val); setPage(1); }}
          status={status}
          onStatusChange={(val) => { setStatus(val); setPage(1); }}
          linkStatus={linkStatus}
          onLinkStatusChange={(val) => { setLinkStatus(val); setPage(1); }}
        />

        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center">
            <h3 className="text-lg font-semibold text-ink">No se encontraron usuarios</h3>
            <p className="mt-1 text-sm text-ink-soft">Intenta ajustar los filtros de búsqueda.</p>
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
