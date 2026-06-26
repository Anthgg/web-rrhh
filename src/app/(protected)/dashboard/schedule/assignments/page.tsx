"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CalendarDays,
  Plus,
  Clock,
  AlertTriangle,
  Users,
  Coffee,
  CalendarClock
} from "lucide-react";

import { scheduleService } from "@/services/schedule.service";
import { workersService } from "@/services/workers.service";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/page-container";
import type { ScheduleAssignmentPayload, ScheduleAssignment, Shift } from "@/types/schedule";
import { extractArray } from "@/lib/utils/extract-array";

import { WorkersListPanel } from "./components/WorkersListPanel";
import { TurnosPanel } from "./components/TurnosPanel";
import { RestDaysPanel } from "./components/RestDaysPanel";

export default function AssignmentsPage() {
  const queryClient = useQueryClient();

  // ----- TAB STATE -----
  const [activeTab, setActiveTab] = useState<"turnos" | "descansos">("turnos");

  // ----- WORKER LIST STATE -----
  const [workerSearch, setWorkerSearch] = useState("");
  const [workerStatusFilter, setWorkerStatusFilter] = useState<"all" | "active" | "inactive" | "with_shift" | "without_shift">("all");
  const [selectedWorkerId, setSelectedWorkerId] = useState("");

  // ----- DATA FETCHING -----
  const { data: assignmentsData, isLoading: isLoadingAssigns, isError: isErrorAssigns, refetch: refetchAssigns } = useQuery({
    queryKey: ["schedule-assignments"],
    queryFn: () => scheduleService.getAssignments(),
    staleTime: 0,
    gcTime: 0,
  });
  const assignments = extractArray<ScheduleAssignment>(assignmentsData);

  const { data: shiftsData } = useQuery({
    queryKey: ["schedule-shifts-active"],
    queryFn: () => scheduleService.getShifts({ is_active: true }),
    staleTime: 0,
    gcTime: 0,
  });
  const shifts = extractArray<Shift>(shiftsData);

  const { data: workersData, isLoading: isLoadingWorkers } = useQuery({
    queryKey: ["all-workers-assign"],
    queryFn: () => workersService.list({ 
      page: 1, 
      limit: 500, // Envía 'limit' (aunque API proxy lo reciba en pageSize, ya lo arreglamos)
      status: "all"
    }),
    staleTime: 60000,
  });
  
  // El backend devuelve { success, data, pagination }, pero nuestro API proxy 
  // (src/app/api/workers/route.ts) lo transforma usando normalizePaginated a { items, total, ... }.
  const workersList = workersData?.items || [];
  const totalWorkersCount = workersData?.total || 0;
  
  // Temporal logs for debugging
  console.log("=== WORKERS DEBUG ===");
  console.log("response.items.length:", workersList.length);

  // ----- DERIVED SUMMARY DATA -----
  const summary = useMemo(() => {
    const totalActiveWorkers = workersList.filter(w => w.status === "active").length;
    const activeAssignments = assignments.filter(a => a.is_active).length;
    return {
      activeWorkers: totalActiveWorkers || totalWorkersCount,
      activeAssignments,
      restDaysThisMonth: 0, // This would ideally be fetched, keeping simple for now
    };
  }, [workersList, assignments, totalWorkersCount]);

  return (
    <PageContainer>
      {/* 1. Header Moderno */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CalendarDays className="size-6 text-primary" />
            Asignación de Turnos
          </h1>
          <p className="text-muted-foreground mt-1 text-sm max-w-xl">
            Programa turnos de trabajo y descansos a los colaboradores con fechas de inicio y fin de vigencia.
            <span className="block mt-0.5 text-xs text-muted-foreground/80">Los descansos programados se reflejan en asistencia y evitan cálculos incorrectos de falta.</span>
          </p>
        </div>
      </div>

      {/* 2. Cards Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border/60 shadow-sm rounded-xl p-5 flex flex-col gap-1 relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Users className="size-16" />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="size-4 text-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Colaboradores</span>
          </div>
          <span className="text-2xl font-bold text-foreground">{summary.activeWorkers}</span>
          <span className="text-xs text-muted-foreground">Activos en el sistema</span>
        </div>

        <div className="bg-card border border-border/60 shadow-sm rounded-xl p-5 flex flex-col gap-1 relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Clock className="size-16" />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="size-4 text-blue-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Turnos Activos</span>
          </div>
          <span className="text-2xl font-bold text-foreground">{summary.activeAssignments}</span>
          <span className="text-xs text-muted-foreground">Asignaciones vigentes</span>
        </div>

        <div className="bg-card border border-border/60 shadow-sm rounded-xl p-5 flex flex-col gap-1 relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Coffee className="size-16" />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Coffee className="size-4 text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Descansos</span>
          </div>
          <span className="text-2xl font-bold text-foreground">-</span>
          <span className="text-xs text-muted-foreground">En el mes actual</span>
        </div>

        <div className="bg-card border border-border/60 shadow-sm rounded-xl p-5 flex flex-col gap-1 relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <CalendarClock className="size-16" />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <CalendarClock className="size-4 text-rose-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Próximo Cambio</span>
          </div>
          <span className="text-lg font-bold text-foreground truncate mt-0.5">-</span>
          <span className="text-xs text-muted-foreground">Cambio de turno programado</span>
        </div>
      </div>

      {/* 3. Tabs Modernas */}
      <div className="flex items-center gap-6 border-b border-border mb-6 px-1">
        <button
          onClick={() => setActiveTab("turnos")}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === "turnos" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Asignación de Turnos
          {activeTab === "turnos" && (
            <span className="absolute bottom-[-1px] left-0 w-full h-[3px] bg-primary rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("descansos")}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === "descansos" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Asistencias Programadas / Descansos
          {activeTab === "descansos" && (
            <span className="absolute bottom-[-1px] left-0 w-full h-[3px] bg-primary rounded-t-full" />
          )}
        </button>
      </div>

      {/* 4. Layout Flex */}
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-280px)] min-h-[600px] overflow-hidden">
        {/* Columna Izquierda: Colaboradores */}
        <div className="w-full lg:w-[340px] shrink-0 h-full">
          <WorkersListPanel
            workersList={workersList}
            assignments={assignments}
            isLoading={isLoadingWorkers}
            searchQuery={workerSearch}
            setSearchQuery={setWorkerSearch}
            statusFilter={workerStatusFilter}
            setStatusFilter={setWorkerStatusFilter}
            selectedWorkerId={selectedWorkerId}
            onSelectWorker={setSelectedWorkerId}
          />
        </div>

        {/* Columna Derecha: Tabs Content */}
        <div className="flex-1 min-w-0 h-full overflow-hidden">
          {activeTab === "turnos" ? (
            <TurnosPanel 
              selectedWorkerId={selectedWorkerId}
              workersList={workersList}
              shifts={shifts}
            />
          ) : (
            <RestDaysPanel 
              workersList={workersList}
              isLoadingWorkers={isLoadingWorkers}
              selectedWorkerId={selectedWorkerId}
            />
          )}
        </div>
      </div>
    </PageContainer>
  );
}
