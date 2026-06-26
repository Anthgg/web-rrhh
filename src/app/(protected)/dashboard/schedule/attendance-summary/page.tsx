"use client";

import { useState, useMemo } from "react";
import { CalendarDays, ShieldAlert, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { scheduleService } from "@/services/schedule.service";
import { workersService } from "@/services/workers.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/page-container";
import { SummaryMetricsCards } from "@/components/attendance/SummaryMetricsCards";
import { AttendanceFilters, AttendanceFiltersValue } from "@/components/attendance/AttendanceFilters";
import { WorkerAttendanceTable } from "@/components/attendance/WorkerAttendanceTable";
import { groupRecordsByWorker } from "@/lib/utils/attendance";
import type { AttendanceSummary, AttendanceDayStatus } from "@/types/schedule";

function getLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function AttendanceSummaryPage() {
  const today = new Date();
  const firstDay = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const lastDay = getLocalDateStr(endOfMonth);

  const [filters, setFilters] = useState<AttendanceFiltersValue>({
    startDate: firstDay,
    endDate: lastDay,
    workerId: "",
    workerSearch: "",
    statusFilter: "all",
  });

  const [committed, setCommitted] = useState({ startDate: firstDay, endDate: lastDay, workerId: "" });

  // Worker search for the filter
  const { data: workersData, isLoading: isLoadingWorkers } = useQuery({
    queryKey: ["workers-search-filter", filters.workerSearch],
    queryFn: () => workersService.list({ search: filters.workerSearch, page: 1, pageSize: 8 }),
    enabled: filters.workerSearch.length > 0,
  });
  const workersList = workersData?.items ?? [];

  // Main attendance data
  const { data: response, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["attendance-summary", committed.startDate, committed.endDate, committed.workerId],
    queryFn: async () => {
      const result = await scheduleService.getAttendanceSummary({
        start_date: committed.startDate,
        end_date: committed.endDate,
        worker_id: committed.workerId || undefined,
      });
      console.log("[attendance-summary] response:", result);
      return result;
    },
    enabled: Boolean(committed.startDate && committed.endDate),
    staleTime: 30_000,
  });

  const records: AttendanceSummary[] = useMemo(() => {
    if (!response) return [];
    const r = response as unknown as Record<string, unknown>;
    if (Array.isArray(r.records)) return r.records as AttendanceSummary[];
    if (Array.isArray(r.data)) return r.data as AttendanceSummary[];
    if (Array.isArray(response)) return response as unknown as AttendanceSummary[];
    return [];
  }, [response]);

  const grouped = useMemo(() => groupRecordsByWorker(records), [records]);

  const totals = useMemo(() => {
    return grouped.reduce(
      (acc, w) => {
        acc.expected += w.expected_hours;
        acc.worked += w.worked_hours;
        acc.effectiveWorked += w.effective_worked_hours;
        acc.lateMinutes += w.late_minutes;
        acc.absentDays += w.absent_days;
        acc.discounts += w.estimated_discounts;
        acc.overtimeHours += w.overtime_hours;
        acc.ordinaryEarnings += w.ordinary_earnings;
        acc.overtimeEarnings += w.overtime_earnings;
        acc.totalEarnings += w.total_earnings;
        return acc;
      },
      {
        expected: 0, worked: 0, effectiveWorked: 0, lateMinutes: 0, absentDays: 0,
        discounts: 0, overtimeHours: 0, ordinaryEarnings: 0, overtimeEarnings: 0, totalEarnings: 0,
      }
    );
  }, [grouped]);

  function handleSearch() {
    setCommitted({ startDate: filters.startDate, endDate: filters.endDate, workerId: filters.workerId });
  }

  function handleClear() {
    setFilters((f) => ({ ...f, workerId: "", workerSearch: "", statusFilter: "all" }));
    setCommitted((c) => ({ ...c, workerId: "" }));
  }

  return (
    <PageContainer variant="wide" className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Horarios y Asistencia</span>
        <span>/</span>
        <span className="text-foreground font-medium">Resumen de asistencia</span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Resumen de Asistencia
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Consulta horas, tardanzas, faltas y pagos por colaborador
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          disabled={isFetching}
          variant="secondary"
          className="flex items-center gap-2 self-start"
        >
          <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Filters */}
      <AttendanceFilters
        value={filters}
        workers={workersList}
        isLoadingWorkers={isLoadingWorkers}
        onChange={(partial) => setFilters((f) => ({ ...f, ...partial }))}
        onSearch={handleSearch}
        onClear={handleClear}
        isLoading={isLoading || isFetching}
      />

      {/* Summary cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="border-border bg-card/80 p-4">
              <div className="space-y-2">
                <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                <div className="h-6 w-16 bg-muted rounded animate-pulse" />
                <div className="h-2.5 w-24 bg-muted rounded animate-pulse" />
              </div>
            </Card>
          ))}
        </div>
      ) : !isError && grouped.length > 0 ? (
        <SummaryMetricsCards totals={totals} />
      ) : null}

      {/* Workers list */}
      {isLoading ? (
        <Card className="overflow-hidden border-border bg-card shadow-sm">
          <div className="p-6 space-y-4">
            <div className="h-4 w-40 bg-muted rounded animate-pulse" />
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-14 bg-muted/50 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </Card>
      ) : isError ? (
        <Card className="flex flex-col items-center justify-center min-h-[280px] border-dashed text-center p-6">
          <div className="rounded-full bg-destructive/10 p-4 text-destructive mb-4">
            <ShieldAlert className="size-8" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No se pudo cargar el resumen</h3>
          <p className="text-muted-foreground text-sm max-w-sm mt-1">
            Revisa la conexión o intenta actualizar los datos nuevamente.
          </p>
          <Button onClick={() => refetch()} className="mt-4" variant="secondary">
            Reintentar
          </Button>
        </Card>
      ) : grouped.length === 0 ? (
        <Card className="flex flex-col items-center justify-center min-h-[280px] border-dashed text-center p-6">
          <div className="rounded-full bg-muted p-4 text-muted-foreground mb-4">
            <CalendarDays className="size-8" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Sin registros</h3>
          <p className="text-muted-foreground text-sm max-w-sm mt-1">
            No se encontraron datos de asistencia para el periodo seleccionado.
          </p>
          <Button onClick={() => refetch()} className="mt-4" variant="secondary">
            Actualizar datos
          </Button>
        </Card>
      ) : (
        <WorkerAttendanceTable
          workers={grouped}
          startDate={committed.startDate}
          endDate={committed.endDate}
          statusFilter={filters.statusFilter as AttendanceDayStatus | "all"}
        />
      )}
    </PageContainer>
  );
}
