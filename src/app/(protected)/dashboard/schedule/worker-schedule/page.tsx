"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Calendar,
  Search,
  Clock,
  ShieldAlert,
  AlertCircle,
  Coffee,
  Timer,
  Target,
  ArrowRight,
  CalendarDays,
} from "lucide-react";

import { scheduleService } from "@/services/schedule.service";
import { workersService } from "@/services/workers.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FieldFrame, Input } from "@/components/ui/fields";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { PageContainer } from "@/components/layout/page-container";
import { WorkersListPanel } from "../assignments/components/WorkersListPanel";

function formatMinutesToHours(minutes: number): string {
  if (isNaN(minutes) || minutes <= 0) return "0 h";
  const hours = minutes / 60;
  if (Number.isInteger(hours)) return `${hours} h`;
  const wholeHours = Math.floor(hours);
  const remainingMinutes = Math.round((hours - wholeHours) * 60);
  return `${wholeHours} h ${remainingMinutes} min`;
}

export default function WorkerSchedulePage() {
  const [workerSearchTerm, setWorkerSearchTerm] = useState("");
  const [workerStatusFilter, setWorkerStatusFilter] = useState<"all" | "active" | "inactive" | "with_shift" | "without_shift">("all");
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().substring(0, 10));

  const { data: workersData, isLoading: isLoadingWorkers } = useQuery({
    queryKey: ["all-workers-schedule"],
    queryFn: () => workersService.list({ 
      page: 1, 
      limit: 500,
      status: "all"
    }),
    staleTime: 60000,
  });

  const workersList = workersData?.items || [];
  const selectedWorker = workersList.find((w) => w.id === selectedWorkerId);

  const { data: schedule, isLoading: isLoadingSchedule, isError, refetch } = useQuery({
    queryKey: ["worker-schedule-detail", selectedWorkerId, selectedDate],
    queryFn: () => scheduleService.getWorkerSchedule(selectedWorkerId, selectedDate),
    enabled: Boolean(selectedWorkerId && selectedDate),
    staleTime: 30_000,
  });

  const queryClient = useQueryClient();

  const setRestDayMutation = useMutation({
    mutationFn: () => scheduleService.setRestDay(selectedWorkerId, selectedDate),
    onSuccess: () => {
      toast.success("Día de descanso asignado correctamente");
      queryClient.invalidateQueries({ queryKey: ["worker-schedule-detail", selectedWorkerId, selectedDate] });
    },
    onError: () => {
      toast.error("Error al asignar día de descanso");
    },
  });

  const removeRestDayMutation = useMutation({
    mutationFn: () => scheduleService.removeRestDay(selectedWorkerId, selectedDate),
    onSuccess: () => {
      toast.success("Día de descanso removido correctamente");
      queryClient.invalidateQueries({ queryKey: ["worker-schedule-detail", selectedWorkerId, selectedDate] });
    },
    onError: () => {
      toast.error("Error al remover día de descanso");
    },
  });

  const formatDateLabel = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  };

  const formatDayOfWeek = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString("es-ES", { weekday: "long" });
  };

  const effectiveMinutes = schedule?.shift
    ? (schedule.shift.break_paid ? 0 : schedule.shift.break_minutes)
    : 0;
  const totalJornada = schedule?.shift
    ? (() => {
        const [startH, startM] = schedule.shift.start_time.split(":").map(Number);
        const [endH, endM] = schedule.shift.end_time.split(":").map(Number);
        const start = startH * 60 + startM;
        const end = endH * 60 + endM;
        return end > start ? end - start : (24 * 60 - start) + end;
      })()
    : 0;
  const horasEfectivas = totalJornada - effectiveMinutes;

  return (
    <PageContainer variant="wide" className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Horarios y Asistencia</span>
        <span>/</span>
        <span className="text-foreground font-medium">Horario de personal</span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Horario del Trabajador</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Consulta la asignación diaria de horarios y turnos de cualquier colaborador en una fecha determinada.
          </p>
        </div>
        <Card className="border-border bg-card/80 shadow-sm p-4 flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="size-4" />
            <span>{formatDateLabel(selectedDate)}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <Badge variant="info">{formatDayOfWeek(selectedDate)}</Badge>
        </Card>
      </div>

      {/* Layout 2 columnas */}
      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        {/* Panel Izquierdo */}
        <div className="space-y-6 h-full flex flex-col">
          <Card className="p-5 bg-card border-border shadow-sm shrink-0">
            <h3 className="text-sm font-bold text-foreground mb-3">Fecha de consulta</h3>
            <FieldFrame label="Seleccionar Fecha">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
              />
            </FieldFrame>
          </Card>

          <div className="flex-1 min-h-[400px]">
            <WorkersListPanel
              workersList={workersList}
              assignments={[]}
              isLoading={isLoadingWorkers}
              searchQuery={workerSearchTerm}
              setSearchQuery={setWorkerSearchTerm}
              statusFilter={workerStatusFilter}
              setStatusFilter={setWorkerStatusFilter}
              selectedWorkerId={selectedWorkerId}
              onSelectWorker={setSelectedWorkerId}
            />
          </div>
        </div>

        {/* Panel Derecho */}
        <div className="space-y-6">
          {!selectedWorkerId ? (
            <Card className="flex flex-col items-center justify-center min-h-[400px] border border-dashed border-border bg-card text-center p-6">
              <div className="rounded-full bg-muted p-4 text-muted-foreground mb-4">
                <Calendar className="size-8" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Selecciona un colaborador</h3>
              <p className="text-muted-foreground text-sm max-w-sm mt-1">
                Busca y selecciona un colaborador del panel izquierdo para ver su horario asignado.
              </p>
            </Card>
          ) : isLoadingSchedule ? (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="size-14 bg-muted rounded-full animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-5 w-40 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-56 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              </Card>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="h-64 bg-muted/50 rounded-3xl animate-pulse" />
                <div className="h-64 bg-muted/50 rounded-3xl animate-pulse" />
              </div>
            </div>
          ) : isError ? (
            <Card className="flex flex-col items-center justify-center min-h-[400px] border border-destructive/20 bg-destructive/5 text-center p-6">
              <div className="rounded-full bg-destructive/10 p-4 text-destructive mb-4">
                <ShieldAlert className="size-8" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Error al cargar el horario</h3>
              <p className="text-muted-foreground text-sm max-w-sm mt-1">
                Ocurrió un error al consultar la información. Intenta de nuevo.
              </p>
              <Button onClick={() => refetch()} className="mt-4" variant="secondary">
                Reintentar
              </Button>
            </Card>
          ) : !schedule || !schedule.shift ? (
            <Card className="flex flex-col items-center justify-center min-h-[400px] border border-dashed border-border bg-card text-center p-6">
              <div className="rounded-full bg-amber-500/10 p-4 text-amber-500 mb-4">
                <AlertCircle className="size-8" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Sin horario asignado</h3>
              <p className="text-muted-foreground text-sm max-w-sm mt-1">
                {schedule?.is_working_day === false
                  ? "Esta fecha está programada como día de descanso para el colaborador."
                  : "No se encontró ningún turno activo para este colaborador en esta fecha."}
              </p>
              {selectedWorker && (
                <div className="mt-6 border-t border-border/60 pt-4 w-full max-w-xs text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Colaborador:</span>
                    <span className="font-semibold text-foreground">{selectedWorker.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha:</span>
                    <span className="font-semibold text-foreground">{formatDateLabel(selectedDate)}</span>
                  </div>
                </div>
              )}
              <div className="flex gap-2 mt-6">
                 {schedule?.is_working_day === false ? (
                    <Button 
                      variant="secondary" 
                      onClick={() => removeRestDayMutation.mutate()}
                      disabled={removeRestDayMutation.isPending}
                    >
                      Remover día de descanso
                    </Button>
                 ) : (
                    <Button 
                      variant="secondary" 
                      onClick={() => setRestDayMutation.mutate()}
                      disabled={setRestDayMutation.isPending}
                    >
                      Marcar como día de descanso
                    </Button>
                 )}
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Card del Colaborador */}
              <Card className="p-6 bg-card border-border shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <UserAvatar
                      src={selectedWorker?.profilePhotoUrl || selectedWorker?.avatarUrl}
                      fullName={selectedWorker?.fullName || "Colaborador"}
                      size="xl"
                    />
                    <div>
                      <h2 className="text-xl font-bold text-foreground">{selectedWorker?.fullName}</h2>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Doc: {selectedWorker?.documentNumber || "—"} &bull; {selectedWorker?.position || "Sin cargo"}
                      </p>
                      {selectedWorker?.departmentName && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Área: {selectedWorker.departmentName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-end gap-2">
                    <Badge variant="success" className="self-start sm:self-auto">
                      Vigente hoy
                    </Badge>
                    <Button 
                      variant="secondary" 
                      onClick={() => setRestDayMutation.mutate()}
                      disabled={setRestDayMutation.isPending}
                    >
                      Marcar como día de descanso
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Mini stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 border-border bg-card/80 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Timer className="size-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Efectivas diarias</p>
                      <p className="text-lg font-bold text-foreground">{formatMinutesToHours(horasEfectivas)}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 border-border bg-card/80 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Coffee className="size-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Break</p>
                      <p className="text-lg font-bold text-foreground">{schedule.shift.break_minutes} min</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 border-border bg-card/80 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <ShieldAlert className="size-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tolerancia</p>
                      <p className="text-lg font-bold text-foreground">{schedule.shift.tolerance_minutes} min</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 border-border bg-card/80 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Target className="size-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Horas extra</p>
                      <p className="text-lg font-bold text-foreground">{schedule.shift.allows_overtime ? "Sí" : "No"}</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Jornada + Timeline */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="p-6 bg-card border-border shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-primary" />
                      <h3 className="text-sm font-bold text-foreground">Jornada Asignada</h3>
                    </div>
                    <Badge variant="success">{schedule.shift.name}</Badge>
                  </div>

                  <div className="flex items-center justify-between gap-4 mb-6">
                    <div className="flex-1 text-center p-4 rounded-2xl bg-muted/40 border border-border/40">
                      <p className="text-[11px] text-muted-foreground uppercase font-semibold">Entrada</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{schedule.shift.start_time.substring(0, 5)}</p>
                    </div>
                    <ArrowRight className="size-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 text-center p-4 rounded-2xl bg-muted/40 border border-border/40">
                      <p className="text-[11px] text-muted-foreground uppercase font-semibold">Salida</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{schedule.shift.end_time.substring(0, 5)}</p>
                    </div>
                  </div>

                  <div className="border-t border-border/40 pt-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Zona horaria</span>
                    <span className="font-semibold text-foreground">{schedule.shift.timezone}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-muted-foreground">Duración total</span>
                    <span className="font-semibold text-foreground">{formatMinutesToHours(totalJornada)}</span>
                  </div>
                </Card>

                {/* Reglas del Turno */}
                <Card className="p-6 bg-card border-border shadow-sm">
                  <div className="flex items-center gap-2 mb-6 border-b border-border/60 pb-3">
                    <CalendarDays className="size-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">Reglas del Turno</h3>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between py-2 border-b border-border/30">
                      <span className="text-muted-foreground">Tolerancia de entrada</span>
                      <span className="font-semibold text-foreground">{schedule.shift.tolerance_minutes} min</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border/30">
                      <span className="text-muted-foreground">Tiempo de break</span>
                      <span className="font-semibold text-foreground">{schedule.shift.break_minutes} min</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border/30">
                      <span className="text-muted-foreground">Break pagado</span>
                      <Badge variant={schedule.shift.break_paid ? "success" : "secondary"}>
                        {schedule.shift.break_paid ? "Pagado" : "No pagado"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border/30">
                      <span className="text-muted-foreground">Tipo de día</span>
                      <Badge variant={schedule.is_working_day ? "info" : "secondary"}>
                        {schedule.is_working_day ? "Laborable" : "Descanso"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-muted-foreground">Horas extra</span>
                      <Badge variant={schedule.shift.allows_overtime ? "success" : "secondary"}>
                        {schedule.shift.allows_overtime ? "Habilitado" : "Deshabilitado"}
                      </Badge>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
