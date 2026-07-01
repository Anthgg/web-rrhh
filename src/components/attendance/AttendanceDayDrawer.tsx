"use client";

import { useCallback, useState } from "react";

import { X, Clock, Camera, FileText, AlertTriangle, Info } from "lucide-react";
import { AttendanceStatusBadge } from "@/components/attendance/AttendanceStatusBadge";
import { normalizeAttendanceStatus, formatDateLocal, formatTime, formatTimeDuration, formatMinutes, formatCurrency, getRecordCheckTime, getDayReason } from "@/lib/utils/attendance";
import type { AttendanceSummary } from "@/types/schedule";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { scheduleService } from "@/services/schedule.service";
import { Button } from "@/components/ui/button";
import { FieldFrame, Input, Select, Textarea } from "@/components/ui/fields";

interface AttendanceDayDrawerProps {
  record: AttendanceSummary | null;
  dateStr: string;
  workerId: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void | Promise<void>;
  context?: {
    restType?: string;
    isHoliday?: boolean;
    holidayName?: string;
  };
}

type AttendanceCorrectionPayload = {
  worker_id: string;
  date: string;
  check_in_time?: string;
  check_out_time?: string;
  status: string;
  reason: string;
};

export function AttendanceDayDrawer({ record, dateStr, workerId, open, onClose, onSuccess, context }: AttendanceDayDrawerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    check_in_time: "",
    check_out_time: "",
    status: "present",
    reason: "",
  });

  const status = record
    ? normalizeAttendanceStatus(record as unknown as Record<string, unknown>)
    : "unknown";

  const row = record ? (record as unknown as Record<string, unknown>) : null;
  const shiftRaw = record?.shift ?? (row?.schedule as Record<string, unknown> | undefined)?.shift;
  const shift = shiftRaw as AttendanceSummary["shift"] | undefined;
  
  const checkIn = record ? getRecordCheckTime(record, "in") : null;
  const checkOut = record ? getRecordCheckTime(record, "out") : null;

  const startEditing = useCallback(() => {
    setFormData({
      check_in_time: checkIn ? formatTime(checkIn) : "",
      check_out_time: checkOut ? formatTime(checkOut) : "",
      status: status === "unknown" || status === "not_scheduled" ? "present" : status,
      reason: "",
    });
    setIsEditing(true);
  }, [checkIn, checkOut, status]);

  const queryClient = useQueryClient();

  const setRestDayMutation = useMutation({
    mutationFn: () => scheduleService.setRestDay(workerId, dateStr),
    onSuccess: async () => {
      toast.success("Día de descanso asignado correctamente");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["worker-rest-days", workerId] }),
        queryClient.invalidateQueries({ queryKey: ["worker-attendance-detail", workerId] }),
        queryClient.invalidateQueries({ queryKey: ["attendance-summary"] }),
      ]);
      await onSuccess?.();
    },
    onError: () => {
      toast.error("Error al asignar día de descanso");
    },
  });

  const removeRestDayMutation = useMutation({
    mutationFn: () => scheduleService.removeRestDay(workerId, dateStr),
    onSuccess: async () => {
      toast.success("Día de descanso removido correctamente");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["worker-rest-days", workerId] }),
        queryClient.invalidateQueries({ queryKey: ["worker-attendance-detail", workerId] }),
        queryClient.invalidateQueries({ queryKey: ["attendance-summary"] }),
      ]);
      await onSuccess?.();
    },
    onError: () => {
      toast.error("Error al remover día de descanso");
    },
  });

  const mutation = useMutation({
    mutationFn: (payload: AttendanceCorrectionPayload) => scheduleService.correctAttendance(payload),
    onSuccess: async () => {
      toast.success("Asistencia actualizada correctamente");
      setIsEditing(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["worker-attendance-detail", workerId] }),
        queryClient.invalidateQueries({ queryKey: ["attendance-summary"] }),
      ]);
      await onSuccess?.();
    },
    onError: (err: unknown) => {
      console.error("[AttendanceDayDrawer] mutation onError:", err);
      toast.error(err instanceof Error ? err.message : "Error al actualizar la asistencia");
    },
  });

  const isWorkingDay = record
    ? ((record as unknown as { is_working_day?: boolean; isWorkingDay?: boolean }).is_working_day ??
      (record as unknown as { isWorkingDay?: boolean }).isWorkingDay)
    : !context?.restType;

  const ensureSeconds = (timeStr?: string) => {
    if (!timeStr) return undefined;
    if (timeStr.split(":").length === 2) return `${timeStr}:00`;
    return timeStr;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateStr || !workerId) return;

    const payload: AttendanceCorrectionPayload = {
      worker_id: workerId,
      date: dateStr,
      check_in_time: ensureSeconds(formData.check_in_time),
      check_out_time: ensureSeconds(formData.check_out_time),
      status: formData.status,
      reason: formData.reason,
    };

    mutation.mutate(payload);
  };

  const content = (
    <div className="flex-1 overflow-y-auto p-5 space-y-5">
      {!record && !isEditing ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-3">
            <Clock className="size-7 text-muted-foreground" />
          </div>
          <p className="font-semibold text-foreground">
            {context?.isHoliday ? "Feriado Nacional" : context?.restType ? "Día de Descanso" : (dateStr ? "Sin marcación" : "Selecciona un día")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {context?.isHoliday ? (context.holidayName || "Es un día feriado") : context?.restType ? `Este es un día de descanso (${context.restType}). No requiere marcación.` : (dateStr 
              ? "No hay registro de asistencia para este día."
              : "Haz clic en el calendario para ver el detalle.")}
          </p>
          {dateStr && !context?.isHoliday && !context?.restType && (
            <Button onClick={startEditing} variant="secondary" className="mt-6">
              Registrar asistencia manual
            </Button>
          )}
        </div>
      ) : isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldFrame label="Hora de entrada (Check-in)">
            <Input
              type="time"
              value={formData.check_in_time}
              onChange={(e) => setFormData({ ...formData, check_in_time: e.target.value })}
            />
          </FieldFrame>
          <FieldFrame label="Hora de salida (Check-out)">
            <Input
              type="time"
              value={formData.check_out_time}
              onChange={(e) => setFormData({ ...formData, check_out_time: e.target.value })}
            />
          </FieldFrame>
          <FieldFrame label="Estado de Asistencia">
            <Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="present">Presente</option>
              <option value="absent">Falta</option>
              <option value="justified">Justificado</option>
              <option value="late">Tardanza</option>
            </Select>
          </FieldFrame>
          <FieldFrame label="Motivo o Justificación">
            <Textarea
              placeholder="Razón del cambio o registro manual..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            />
          </FieldFrame>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsEditing(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      ) : (
        <>
          {/* Status & Reason */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Estado</span>
            <AttendanceStatusBadge status={status} />
          </div>
          
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-1">
            <p className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Info className="size-3.5" />
              Motivo
            </p>
            <p className="text-sm font-medium text-foreground">
              {getDayReason(status)}
            </p>
          </div>

          {/* Schedule */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="size-3.5" />
              Horario del turno
            </p>
            {shift?.name && (
              <DataRow label="Turno" value={shift.name} />
            )}
            <DataRow
              label="Entrada esperada"
              value={formatTime(shift?.start_time ?? shift?.startTime)}
            />
            <DataRow
              label="Salida esperada"
              value={formatTime(shift?.end_time ?? shift?.endTime)}
            />
            {(shift?.tolerance_minutes ?? shift?.toleranceMinutes) !== undefined && (
              <DataRow
                label="Tolerancia"
                value={`${shift?.tolerance_minutes ?? shift?.toleranceMinutes} min`}
              />
            )}
          </div>

          {/* Check-ins */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="size-3.5" />
              Marcaciones reales
            </p>
            <DataRow
              label="Check-in"
              value={checkIn ? formatTime(checkIn) : "—"}
              valueClass={checkIn ? "text-emerald-600 dark:text-emerald-400 font-semibold" : ""}
            />
            <DataRow
              label="Check-out"
              value={checkOut ? formatTime(checkOut) : "—"}
              valueClass={checkOut ? "text-indigo-600 dark:text-indigo-400 font-semibold" : ""}
            />
          </div>

          {/* Time metrics */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Horas
            </p>
            <DataRow label="Esperadas" value={formatTimeDuration(record!.expected_hours)} />
            <DataRow label="Trabajadas" value={formatTimeDuration(record!.worked_hours)} />
            <DataRow label="Efectivas" value={formatTimeDuration(record!.effective_worked_hours)} />
            {(record!.overtime_hours ?? 0) > 0 && (
              <DataRow
                label="Horas extra"
                value={`+${formatTimeDuration(record!.overtime_hours)}`}
                valueClass="text-amber-600 dark:text-amber-400 font-semibold"
              />
            )}
            {(record!.late_minutes ?? 0) > 0 && (
              <DataRow
                label="Tardanza"
                value={formatMinutes(record!.late_minutes)}
                valueClass="text-rose-500 font-semibold"
              />
            )}
          </div>

          {/* Financials */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Ingresos del día
            </p>
            <DataRow label="Ingreso regular" value={formatCurrency(record!.ordinary_earnings)} />
            {(record!.overtime_earnings ?? 0) > 0 && (
              <DataRow
                label="Ingreso extra (2×)"
                value={formatCurrency(record!.overtime_earnings)}
                valueClass="text-amber-600 dark:text-amber-400 font-semibold"
              />
            )}
            <DataRow
              label="Total generado"
              value={formatCurrency(record!.total_earnings)}
              valueClass="text-indigo-600 dark:text-indigo-400 font-bold"
            />
            {(record!.estimated_discounts ?? 0) > 0 && (
              <DataRow
                label="Descuento"
                value={formatCurrency(record!.estimated_discounts)}
                valueClass="text-rose-500 font-semibold"
              />
            )}
          </div>

          {/* Evidence photo if available */}
          {(record as unknown as Record<string, unknown>).evidence_photo_url && (
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="size-3.5" />
                Evidencia
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={String((record as unknown as Record<string, unknown>).evidence_photo_url)}
                alt="Evidencia de marcación"
                className="w-full rounded-lg object-cover max-h-48 border border-border"
              />
            </div>
          )}

          {/* Observations */}
          {(record as unknown as Record<string, unknown>).observations && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="size-3.5" />
                Observaciones
              </p>
              <p className="text-sm text-foreground">
                {String((record as unknown as Record<string, unknown>).observations)}
              </p>
            </div>
          )}

          {/* Absence note */}
          {(record!.absent_days ?? 0) > 0 && !checkIn && (
            <div className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
              <AlertTriangle className="size-4 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-600 dark:text-rose-400">
                El colaborador no registró marcación en este día.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <>
      {/* 
        =============================================
        MOBILE DRAWER (Hidden on xl)
        =============================================
      */}
      <div className="xl:hidden">
        {/* Backdrop */}
        {open && (
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
        )}
        {/* Drawer */}
        <div
          className={`fixed right-0 top-0 z-50 h-full w-full max-w-sm bg-card shadow-2xl border-l border-border flex flex-col transition-transform duration-300 ease-in-out ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4 bg-muted/20">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Detalle del día</p>
              <p className="mt-0.5 text-base font-bold text-foreground">
                {dateStr ? formatDateLocal(dateStr) : "Selecciona un día"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing && dateStr && (
                <>
                  <Button variant="secondary" onClick={startEditing}>
                    Editar
                  </Button>
                  {isWorkingDay === false ? (
                    <Button 
                      variant="secondary" 
                      onClick={() => removeRestDayMutation.mutate()}
                      disabled={removeRestDayMutation.isPending}
                    >
                      Remover Descanso
                    </Button>
                  ) : (
                    <Button 
                      variant="secondary" 
                      onClick={() => setRestDayMutation.mutate()}
                      disabled={setRestDayMutation.isPending}
                    >
                      Marcar Descanso
                    </Button>
                  )}
                </>
              )}
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>
          {/* Body */}
          {content}
        </div>
      </div>

      {/* 
        =============================================
        DESKTOP PANEL (Hidden on < xl)
        =============================================
      */}
      <div className="hidden xl:flex flex-col border border-border bg-card rounded-2xl h-[800px] shadow-sm overflow-hidden sticky top-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 bg-muted/20 shrink-0">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Detalle del día</p>
            <p className="mt-0.5 text-base font-bold text-foreground">
              {dateStr ? formatDateLocal(dateStr) : "Selecciona un día"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && dateStr && (
              <>
                <Button variant="secondary" onClick={startEditing}>
                  Editar
                </Button>
                {isWorkingDay === false ? (
                  <Button 
                    variant="secondary" 
                    onClick={() => removeRestDayMutation.mutate()}
                    disabled={removeRestDayMutation.isPending}
                  >
                    Remover Descanso
                  </Button>
                ) : (
                  <Button 
                    variant="secondary" 
                    onClick={() => setRestDayMutation.mutate()}
                    disabled={setRestDayMutation.isPending}
                  >
                    Marcar Descanso
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
        {/* Body */}
        {content}
      </div>
    </>
  );
}

function DataRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className={`text-sm text-right ${valueClass || "text-foreground font-medium"}`}>
        {value}
      </span>
    </div>
  );
}
