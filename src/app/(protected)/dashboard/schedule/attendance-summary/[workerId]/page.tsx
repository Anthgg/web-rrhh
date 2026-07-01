"use client";

import { use, useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, CalendarDays } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WorkerAttendanceHeader } from "@/components/attendance/WorkerAttendanceHeader";
import { WorkerPayrollMetrics } from "@/components/attendance/WorkerPayrollMetrics";
import { WorkerAttendanceCalendar } from "@/components/attendance/WorkerAttendanceCalendar";
import { AttendanceDayDrawer } from "@/components/attendance/AttendanceDayDrawer";
import { WorkerAttendanceHistoryTable } from "@/components/attendance/WorkerAttendanceHistoryTable";
import { useWorkerAttendanceDetail } from "@/hooks/useAttendanceSummary";
import { normalizeAttendanceStatus } from "@/lib/utils/attendance";
import type { AttendanceSummary, AttendanceDayStatus } from "@/types/schedule";

function getLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getSafeRecordDayKey(record: AttendanceSummary): string {
  return (
    record.dateKey ??
    record.dayKey ??
    record.calendarDate ??
    record.dateTime?.split("T")[0] ??
    record.calendarDateTime?.split("T")[0] ??
    ""
  );
}

interface PageProps {
  params: Promise<{ workerId: string }>;
}

export default function WorkerAttendanceDetailPage({ params }: PageProps) {
  // Next.js 16: params is a Promise and must be unwrapped with React.use()
  const { workerId } = use(params);
  const searchParams = useSearchParams();

  const today = new Date();
  const firstDay = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const lastDay = getLocalDateStr(endOfMonth);

  const startDate = searchParams.get("start_date") ?? firstDay;
  const endDate = searchParams.get("end_date") ?? lastDay;

  const { records, recordsByDate, calendarByDate, worker, isLoading, isError, refetch } = useWorkerAttendanceDetail(workerId, {
    startDate,
    endDate,
  });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceSummary | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string>("");
  const [selectedContext, setSelectedContext] = useState<{ restType?: string; isHoliday?: boolean; holidayName?: string }>({});

  const selectedRecordForDrawer = useMemo(() => {
    if (!selectedDateStr) return selectedRecord;
    return records.find((r) => getSafeRecordDayKey(r) === selectedDateStr) ?? selectedRecord;
  }, [records, selectedDateStr, selectedRecord]);

  const handleDrawerSuccess = useCallback(async () => {
    if (!selectedDateStr) {
      await refetch();
      return;
    }

    const result = await refetch();
    const updated = result.data?.records?.find((r) => getSafeRecordDayKey(r) === selectedDateStr);
    if (updated) {
      setSelectedRecord(updated);
    }
  }, [refetch, selectedDateStr]);

  function handleDayClick(record: AttendanceSummary | null, dateStr: string, context?: { restType?: string; isHoliday?: boolean; holidayName?: string }) {
    setSelectedRecord(record);
    setSelectedDateStr(dateStr);
    setSelectedContext(context || {});
    setDrawerOpen(true);
  }

  function handleRowClick(record: AttendanceSummary) {
    setSelectedRecord(record);
    setSelectedDateStr(getSafeRecordDayKey(record));
    setDrawerOpen(true);
  }

  const dominantStatus: AttendanceDayStatus = worker
    ? (normalizeAttendanceStatus({ status: worker.dominant_status } as unknown as Record<string, unknown>))
    : "pending";

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <PageContainer variant="wide" className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-start gap-4">
          <div className="size-16 rounded-full bg-muted animate-pulse shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-7 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          </div>
        </div>
        {/* Metrics skeleton */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 11 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="space-y-2">
                <div className="h-2.5 w-16 bg-muted rounded animate-pulse" />
                <div className="h-5 w-20 bg-muted rounded animate-pulse" />
              </div>
            </Card>
          ))}
        </div>
        {/* Calendar skeleton */}
        <div className="h-96 bg-muted/50 rounded-2xl animate-pulse" />
      </PageContainer>
    );
  }

  // ─── Error ─────────────────────────────────────────────────────────────────
  if (isError || !worker) {
    return (
      <PageContainer variant="wide">
        <Card className="flex flex-col items-center justify-center min-h-[300px] border-dashed text-center p-6">
          <div className="rounded-full bg-destructive/10 p-4 text-destructive mb-4">
            <ShieldAlert className="size-8" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            {isError ? "No se pudo cargar el detalle" : "Colaborador no encontrado"}
          </h3>
          <p className="text-muted-foreground text-sm max-w-sm mt-1">
            Verifica que el colaborador existe y que el periodo seleccionado tiene registros.
          </p>
          <Button onClick={() => refetch()} className="mt-4" variant="secondary">
            Reintentar
          </Button>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer variant="wide" className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Horarios y Asistencia</span>
        <span>/</span>
        <Link
          href="/dashboard/schedule/attendance-summary"
          className="hover:text-foreground transition-colors"
        >
          Resumen de asistencia
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-[200px]">{worker.worker_name}</span>
      </div>

      {/* Worker header */}
      <WorkerAttendanceHeader
        worker={worker}
        dominantStatus={dominantStatus}
        startDate={startDate}
        endDate={endDate}
      />

      {/* Metrics */}
      <WorkerPayrollMetrics worker={worker} />

      {/* Calendar + history */}
      {records.length === 0 ? (
        <Card className="flex flex-col items-center justify-center min-h-[200px] border-dashed text-center p-6">
          <div className="rounded-full bg-muted p-4 text-muted-foreground mb-3">
            <CalendarDays className="size-7" />
          </div>
          <p className="font-semibold text-foreground">Sin registros en este periodo</p>
          <p className="mt-1 text-sm text-muted-foreground">
            No se encontraron marcaciones para el rango de fechas seleccionado.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          {/* Calendar */}
          <div className="min-w-0">
            <WorkerAttendanceCalendar
              records={records}
              recordsByDate={recordsByDate}
              calendarByDate={calendarByDate}
              onDayClick={handleDayClick}
              workerId={workerId}
              queryStartDate={startDate}
              queryEndDate={endDate}
            />
          </div>

          {/* Sidebar / Drawer */}
          <AttendanceDayDrawer
            open={drawerOpen}
            record={selectedRecordForDrawer}
            dateStr={selectedDateStr}
            workerId={workerId}
            onClose={() => setDrawerOpen(false)}
            onSuccess={handleDrawerSuccess}
            context={selectedContext}
          />
        </div>
      )}

      {/* History table */}
      {records.length > 0 && (
        <WorkerAttendanceHistoryTable
          records={records}
          onRowClick={handleRowClick}
        />
      )}
    </PageContainer>
  );
}
