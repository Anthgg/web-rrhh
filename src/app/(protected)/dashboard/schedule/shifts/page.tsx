"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Clock,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Coffee,
  Timer,
  Target,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { scheduleService } from "@/services/schedule.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/fields";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import type { Shift, ShiftPayload } from "@/types/schedule";
import { extractArray } from "@/lib/utils/extract-array";
import { PageContainer } from "@/components/layout/page-container";

const ITEMS_PER_PAGE = 10;

function formatMinutesToHours(minutes: number): string {
  if (isNaN(minutes) || minutes <= 0) return "0 h";
  const hours = minutes / 60;
  if (Number.isInteger(hours)) return `${hours} h`;
  const wholeHours = Math.floor(hours);
  const remainingMinutes = Math.round((hours - wholeHours) * 60);
  return `${wholeHours} h ${remainingMinutes} min`;
}

export default function ShiftsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmToggleId, setConfirmToggleId] = useState<string | null>(null);
  const [confirmToggleState, setConfirmToggleState] = useState<boolean>(false);

  const { data: shiftsData, isLoading, refetch } = useQuery({
    queryKey: ["schedule-shifts"],
    queryFn: () => scheduleService.getShifts(),
    staleTime: 30_000,
  });

  const shifts = useMemo(() => {
    const raw = extractArray<Shift>(shiftsData);
    const seen = new Set<string>();
    return raw.filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }, [shiftsData]);

  const invalidateAllScheduleQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["schedule-shifts"] });
    queryClient.invalidateQueries({ queryKey: ["schedule-shifts-active"] });
    queryClient.invalidateQueries({ queryKey: ["schedule-assignments"] });
    queryClient.invalidateQueries({ queryKey: ["worker-schedule-detail"] });
    queryClient.invalidateQueries({ queryKey: ["my-schedule-detail"] });
    queryClient.invalidateQueries({ queryKey: ["attendance-summary-list"] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: ShiftPayload) => scheduleService.createShift(payload),
    onSuccess: () => {
      invalidateAllScheduleQueries();
      toast.success("Turno laboral creado correctamente.");
    },
    onError: (err: { message?: string }) => {
      toast.error(err?.message || "Ocurrió un error al crear el turno.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ShiftPayload }) =>
      scheduleService.updateShift(id, payload),
    onSuccess: () => {
      invalidateAllScheduleQueries();
      toast.success("Turno laboral actualizado correctamente.");
    },
    onError: (err: { message?: string }) => {
      toast.error(err?.message || "Ocurrió un error al actualizar el turno.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => scheduleService.deleteShift(id),
    onSuccess: () => {
      invalidateAllScheduleQueries();
      toast.success("Turno eliminado correctamente.");
      setConfirmDeleteId(null);
    },
    onError: (err: { message?: string }) => {
      toast.error(err?.message || "No se pudo eliminar el turno.");
      setConfirmDeleteId(null);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active, existingShift }: { id: string; is_active: boolean; existingShift: Shift }) => {
      const start = (existingShift.startTime || existingShift.start_time).substring(0, 5);
      const end = (existingShift.endTime || existingShift.end_time).substring(0, 5);
      const tolerance = existingShift.toleranceMinutes ?? existingShift.tolerance_minutes;
      const breakMins = existingShift.breakMinutes ?? existingShift.break_minutes;
      const breakPd = existingShift.breakPaid ?? existingShift.break_paid;
      const weeklyTarget = existingShift.weeklyTargetMinutes ?? existingShift.weekly_target_minutes;
      const days = existingShift.workingDays || existingShift.working_days || [];
      const allowsOt = existingShift.allowsOvertime ?? existingShift.allows_overtime;
      const effectiveMins = existingShift.effectiveMinutes ?? existingShift.effective_minutes;

      const payload: ShiftPayload = {
        name: existingShift.name,
        start_time: start,
        startTime: start,
        end_time: end,
        endTime: end,
        tolerance_minutes: tolerance,
        toleranceMinutes: tolerance,
        break_minutes: breakMins,
        breakMinutes: breakMins,
        break_paid: breakPd,
        breakPaid: breakPd,
        weekly_target_minutes: weeklyTarget,
        weeklyTargetMinutes: weeklyTarget,
        working_days: days,
        workingDays: days,
        timezone: existingShift.timezone,
        allows_overtime: allowsOt,
        allowsOvertime: allowsOt,
        is_active,
        isActive: is_active,
        effective_minutes: effectiveMins,
        effectiveMinutes: effectiveMins,
      };
      return scheduleService.updateShift(id, payload);
    },
    onSuccess: () => {
      invalidateAllScheduleQueries();
      toast.success("Estado del turno modificado correctamente.");
      setConfirmToggleId(null);
    },
    onError: (err: { message?: string }) => {
      toast.error(err?.message || "No se pudo cambiar el estado del turno.");
      setConfirmToggleId(null);
    },
  });

  const filteredShifts = useMemo(() => {
    return shifts.filter((shift) => {
      const matchesSearch = shift.name.toLowerCase().includes(searchTerm.toLowerCase());
      const active = shift.isActive ?? shift.is_active ?? false;
      const matchesStatus =
        statusFilter === "all" ? true : statusFilter === "active" ? active : !active;
      return matchesSearch && matchesStatus;
    });
  }, [shifts, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredShifts.length / ITEMS_PER_PAGE);
  const paginatedShifts = filteredShifts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalShifts = shifts.length;
  const activeShifts = shifts.filter((s) => s.isActive ?? s.is_active ?? false).length;
  const inactiveShifts = totalShifts - activeShifts;
  const avgEffectiveHours = totalShifts > 0
    ? Math.round(shifts.reduce((acc, s) => acc + (s.effectiveMinutes ?? s.effective_minutes ?? 480), 0) / totalShifts)
    : 0;

  return (
    <PageContainer variant="wide" className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Horarios y Asistencia</span>
        <span>/</span>
        <span className="text-foreground font-medium">Turnos</span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Turnos Laborales</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Administra jornadas, descansos, tolerancias y objetivos semanales del personal.
          </p>
        </div>
        <Link href="/dashboard/schedule/shifts/new">
          <Button className="flex items-center gap-2">
            <Plus className="size-4" />
            Crear Turno
          </Button>
        </Link>
      </div>

      {/* Cards de Resumen */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-border bg-card/80 shadow-sm p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-7 w-12 bg-muted rounded animate-pulse" />
                  <div className="h-2 w-32 bg-muted rounded animate-pulse" />
                </div>
                <div className="size-11 bg-muted rounded-xl animate-pulse" />
              </div>
            </Card>
          ))
        ) : (
          <>
            <Card className="border-border bg-card/80 shadow-sm transition hover:shadow-md p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total de turnos</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{totalShifts}</p>
              <p className="mt-1 text-xs text-muted-foreground">Registrados en el sistema</p>
            </div>
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <Clock className="size-5" />
            </div>
          </div>
        </Card>
        <Card className="border-border bg-card/80 shadow-sm transition hover:shadow-md p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Turnos activos</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{activeShifts}</p>
              <p className="mt-1 text-xs text-muted-foreground">Disponibles para asignar</p>
            </div>
            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-500">
              <ToggleRight className="size-5" />
            </div>
          </div>
        </Card>
        <Card className="border-border bg-card/80 shadow-sm transition hover:shadow-md p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Turnos inactivos</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{inactiveShifts}</p>
              <p className="mt-1 text-xs text-muted-foreground">No disponibles</p>
            </div>
            <div className="rounded-xl bg-orange-500/10 p-3 text-orange-500">
              <ToggleLeft className="size-5" />
            </div>
          </div>
        </Card>
        <Card className="border-border bg-card/80 shadow-sm transition hover:shadow-md p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Promedio efectivo</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{formatMinutesToHours(avgEffectiveHours)}</p>
              <p className="mt-1 text-xs text-muted-foreground">Horas diarias por turno</p>
            </div>
            <div className="rounded-xl bg-blue-500/10 p-3 text-blue-500">
              <Timer className="size-5" />
            </div>
          </div>
            </Card>
          </>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70" />
          <input
            type="text"
            placeholder="Buscar turno por nombre..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="h-10 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as "all" | "active" | "inactive"); setCurrentPage(1); }}
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Solo Activos</option>
            <option value="inactive">Solo Inactivos</option>
          </select>
          {(searchTerm || statusFilter !== "all") && (
            <Button
              variant="ghost"
              onClick={() => { setSearchTerm(""); setStatusFilter("all"); setCurrentPage(1); }}
              className="text-muted-foreground h-10 px-3 text-sm"
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>

      {/* Tabla */}
      {isLoading ? (
        <Card className="overflow-hidden border-border bg-card shadow-sm">
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <div className="h-4 w-48 bg-muted rounded animate-pulse" />
              <div className="h-3 w-72 bg-muted rounded animate-pulse" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </Card>
      ) : filteredShifts.length === 0 ? (
        <Card className="border-border bg-card shadow-sm">
          <div className="flex flex-col items-center justify-center min-h-[300px] p-6 text-center">
            <div className="rounded-full bg-muted p-4 text-muted-foreground mb-4">
              <Clock className="size-8" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No hay turnos registrados</h3>
            <p className="text-muted-foreground text-sm max-w-sm mt-1">
              Crea tu primer turno laboral para asignarlo luego al personal.
            </p>
            <Link href="/dashboard/schedule/shifts/new" className="mt-4">
              <Button>
                <Plus className="size-4 mr-2" />
                Crear turno
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden border-border bg-card shadow-sm">
          <div className="border-b border-border/60 px-6 py-4">
            <h3 className="text-base font-bold text-foreground">Listado de turnos</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Consulta, edita o desactiva los turnos laborales configurados.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-3.5">Nombre del Turno</th>
                  <th className="px-6 py-3.5">Horario</th>
                  <th className="px-6 py-3.5">Efectivas</th>
                  <th className="px-6 py-3.5">Descanso</th>
                  <th className="px-6 py-3.5">Tolerancia</th>
                  <th className="px-6 py-3.5">Objetivo Semanal</th>
                  <th className="px-6 py-3.5">Estado</th>
                  <th className="px-6 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {paginatedShifts.map((shift) => {
                  const startTime = (shift.startTime || shift.start_time || "00:00").substring(0, 5);
                  const endTime = (shift.endTime || shift.end_time || "00:00").substring(0, 5);
                  const effectiveMins = shift.effectiveMinutes ?? shift.effective_minutes ?? 0;
                  const breakMins = shift.breakMinutes ?? shift.break_minutes ?? 0;
                  const breakPd = shift.breakPaid ?? shift.break_paid ?? false;
                  const toleranceMins = shift.toleranceMinutes ?? shift.tolerance_minutes ?? 0;
                  const weeklyTarget = shift.weeklyTargetMinutes ?? shift.weekly_target_minutes ?? 0;
                  const active = shift.isActive ?? shift.is_active ?? false;

                  return (
                    <tr key={shift.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{shift.name}</div>
                        <div className="text-xs text-muted-foreground">Jornada laboral</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-foreground font-medium">
                          <Clock className="size-3.5 text-muted-foreground" />
                          {startTime} - {endTime}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{formatMinutesToHours(effectiveMins)}</div>
                        <div className="text-xs text-muted-foreground">{effectiveMins} min</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{breakMins} min</div>
                        <div className="text-xs text-muted-foreground">{breakPd ? "Pagado" : "No pagado"}</div>
                      </td>
                      <td className="px-6 py-4 text-foreground font-medium">{toleranceMins} min</td>
                      <td className="px-6 py-4 text-foreground font-medium">{formatMinutesToHours(weeklyTarget)}</td>
                      <td className="px-6 py-4">
                        <Badge variant={active ? "success" : "secondary"}>
                          {active ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setConfirmToggleId(shift.id);
                              setConfirmToggleState(!active);
                            }}
                            title={active ? "Desactivar" : "Activar"}
                            className="size-8 p-0"
                          >
                            {active ? <ToggleRight className="size-4 text-primary" /> : <ToggleLeft className="size-4 text-muted-foreground" />}
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => router.push(`/dashboard/schedule/shifts/${shift.id}/edit`)}
                            title="Editar"
                            className="size-8 p-0"
                          >
                            <Edit2 className="size-4 text-foreground/70" />
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => setConfirmDeleteId(shift.id)}
                            title="Eliminar"
                            className="size-8 p-0 hover:text-rose-500"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/60 px-6 py-3">
              <p className="text-sm text-muted-foreground">
                Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredShifts.length)} de {filteredShifts.length}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="size-8 p-0"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, idx, arr) => (
                    <span key={p} className="flex items-center">
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-muted-foreground">...</span>}
                      <Button
                        variant={p === currentPage ? "primary" : "ghost"}
                        onClick={() => setCurrentPage(p)}
                        className="size-8 p-0 text-sm"
                      >
                        {p}
                      </Button>
                    </span>
                  ))}
                <Button
                  variant="ghost"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="size-8 p-0"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Diálogos de Confirmación */}
      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="¿Eliminar Turno Laboral?"
        description="Esta acción eliminará de forma permanente la configuración de este turno. No se puede deshacer si tiene registros asociados."
        confirmLabel="Eliminar Turno"
        cancelLabel="Conservar"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => { if (confirmDeleteId) deleteMutation.mutate(confirmDeleteId); }}
        onCancel={() => setConfirmDeleteId(null)}
      />

      <ConfirmDialog
        open={confirmToggleId !== null}
        title={confirmToggleState ? "¿Activar Turno Laboral?" : "¿Desactivar Turno Laboral?"}
        description={
          confirmToggleState
            ? "El turno volverá a estar disponible para asignaciones operativas."
            : "Al desactivar el turno, los trabajadores mantendrán sus registros históricos, pero ya no estará disponible para nuevas asignaciones."
        }
        confirmLabel={confirmToggleState ? "Activar" : "Desactivar"}
        cancelLabel="Cancelar"
        isLoading={toggleActiveMutation.isPending}
        onConfirm={() => {
          if (confirmToggleId) {
            const existing = shifts.find((s) => s.id === confirmToggleId);
            if (existing) {
              toggleActiveMutation.mutate({
                id: confirmToggleId,
                is_active: confirmToggleState,
                existingShift: existing,
              });
            }
          }
        }}
        onCancel={() => setConfirmToggleId(null)}
      />
    </PageContainer>
  );
}
