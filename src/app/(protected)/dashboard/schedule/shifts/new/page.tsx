"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Clock,
  Coffee,
  ShieldCheck,
  Target,
  CalendarDays,
  Info,
  Loader2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { scheduleService } from "@/services/schedule.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FieldFrame, Input, Select } from "@/components/ui/fields";
import { PageContainer } from "@/components/layout/page-container";
import type { ShiftPayload } from "@/types/schedule";

const DAYS_OF_WEEK = [
  { value: 1, label: "L", fullName: "Lunes" },
  { value: 2, label: "M", fullName: "Martes" },
  { value: 3, label: "M", fullName: "Miércoles" },
  { value: 4, label: "J", fullName: "Jueves" },
  { value: 5, label: "V", fullName: "Viernes" },
  { value: 6, label: "S", fullName: "Sábado" },
  { value: 7, label: "D", fullName: "Domingo" },
];

const TIMEZONES = [
  { value: "America/Lima", label: "America/Lima (PET - UTC-5)" },
  { value: "America/Bogota", label: "America/Bogota (COT - UTC-5)" },
  { value: "America/Santiago", label: "America/Santiago (CLT - UTC-4)" },
  { value: "America/Mexico_City", label: "America/Mexico_City (CST - UTC-6)" },
  { value: "UTC", label: "Coordinated Universal Time (UTC)" },
];

function formatMinutesToHours(minutes: number): string {
  if (isNaN(minutes) || minutes <= 0) return "0 h";
  const hours = minutes / 60;
  if (Number.isInteger(hours)) return `${hours} h`;
  const wholeHours = Math.floor(hours);
  const remainingMinutes = Math.round((hours - wholeHours) * 60);
  return `${wholeHours} h ${remainingMinutes} min`;
}

function calculateDuration(start: string, end: string): number {
  if (!start || !end) return 0;
  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  return endMinutes > startMinutes ? endMinutes - startMinutes : (24 * 60 - startMinutes) + endMinutes;
}

export default function NewShiftPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: policy } = useQuery({
    queryKey: ["schedule-policies"],
    queryFn: () => scheduleService.getSchedulePolicies(),
    staleTime: 30_000,
  });

  const [formData, setFormData] = useState<ShiftPayload>({
    name: "",
    start_time: "08:00",
    startTime: "08:00",
    end_time: "17:00",
    endTime: "17:00",
    tolerance_minutes: policy?.lateToleranceMinutes ?? 15,
    toleranceMinutes: policy?.lateToleranceMinutes ?? 15,
    break_minutes: policy?.defaultBreakMinutes ?? 45,
    breakMinutes: policy?.defaultBreakMinutes ?? 45,
    break_paid: policy?.defaultBreakPaid ?? false,
    breakPaid: policy?.defaultBreakPaid ?? false,
    weekly_target_minutes: policy?.weeklyTargetMinutes ?? 2880,
    weeklyTargetMinutes: policy?.weeklyTargetMinutes ?? 2880,
    working_days: (policy?.workingDays as number[] | undefined) ?? [1, 2, 3, 4, 5, 6],
    workingDays: (policy?.workingDays as number[] | undefined) ?? [1, 2, 3, 4, 5, 6],
    timezone: policy?.timezone || "America/Lima",
    allows_overtime: true,
    allowsOvertime: true,
    is_active: true,
    isActive: true,
    effective_minutes: 480,
    effectiveMinutes: 480,
  });

  const createMutation = useMutation({
    mutationFn: (payload: ShiftPayload) => scheduleService.createShift(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-shifts"] });
      toast.success("Turno laboral creado correctamente.");
      router.push("/dashboard/schedule/shifts");
    },
    onError: (err: { message?: string }) => {
      toast.error(err?.message || "Ocurrió un error al crear el turno.");
    },
  });

  const handleChange = (name: keyof ShiftPayload, value: string | number | boolean | number[]) => {
    setFormData((prev) => {
      const updated = { ...prev, [name]: value } as ShiftPayload;

      if (name === "start_time") updated.startTime = value as string;
      if (name === "startTime") updated.start_time = value as string;
      if (name === "end_time") updated.endTime = value as string;
      if (name === "endTime") updated.end_time = value as string;
      if (name === "tolerance_minutes") updated.toleranceMinutes = value as number;
      if (name === "toleranceMinutes") updated.tolerance_minutes = value as number;
      if (name === "break_minutes") updated.breakMinutes = value as number;
      if (name === "breakMinutes") updated.break_minutes = value as number;
      if (name === "break_paid") updated.breakPaid = value as boolean;
      if (name === "breakPaid") updated.break_paid = value as boolean;
      if (name === "weekly_target_minutes") updated.weeklyTargetMinutes = value as number;
      if (name === "weeklyTargetMinutes") updated.weekly_target_minutes = value as number;
      if (name === "working_days") updated.workingDays = value as number[];
      if (name === "workingDays") updated.working_days = value as number[];
      if (name === "allows_overtime") updated.allowsOvertime = value as boolean;
      if (name === "allowsOvertime") updated.allows_overtime = value as boolean;
      if (name === "is_active") updated.isActive = value as boolean;
      if (name === "isActive") updated.is_active = value as boolean;
      if (name === "effective_minutes") updated.effectiveMinutes = value as number;
      if (name === "effectiveMinutes") updated.effective_minutes = value as number;

      return updated;
    });
  };

  const toggleDay = (dayValue: number) => {
    setFormData((prev) => {
      const currentDays = prev.workingDays || prev.working_days || [];
      const workingDays = currentDays.includes(dayValue)
        ? currentDays.filter((d) => d !== dayValue)
        : [...currentDays, dayValue].sort((a, b) => a - b);
      return { ...prev, working_days: workingDays, workingDays };
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("El nombre del turno es obligatorio.");
      return;
    }
    if (!formData.start_time || !formData.end_time) {
      toast.error("Las horas de entrada y salida son obligatorias.");
      return;
    }
    if (formData.tolerance_minutes < 0) {
      toast.error("La tolerancia no puede ser negativa.");
      return;
    }
    if (formData.break_minutes < 0) {
      toast.error("El tiempo de break no puede ser negativo.");
      return;
    }
    if ((formData.effective_minutes ?? 0) <= 0) {
      toast.error("Las minutos efectivos diarios deben ser mayores a cero.");
      return;
    }
    if (formData.weekly_target_minutes <= 0) {
      toast.error("Las horas semanales objetivo deben ser mayores a cero.");
      return;
    }
    const days = formData.workingDays || formData.working_days || [];
    if (days.length === 0) {
      toast.error("Debe seleccionar al menos un día laboral.");
      return;
    }

    createMutation.mutate(formData);
  };

  const duration = useMemo(() => calculateDuration(formData.start_time, formData.end_time), [formData.start_time, formData.end_time]);
  const breakMinutes = formData.break_minutes ?? formData.breakMinutes ?? 0;
  const effectiveDaily = duration - (formData.break_paid ? 0 : breakMinutes);
  const days = formData.workingDays || formData.working_days || [];

  return (
    <PageContainer variant="wide" className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={() => router.push("/dashboard/schedule/shifts")} className="hover:text-foreground transition-colors">
          Turnos Laborales
        </button>
        <span>/</span>
        <span className="text-foreground font-medium">Crear Turno</span>
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Clock className="size-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Crear nuevo turno laboral</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Define la jornada, descansos, tolerancias y reglas de asistencia para este turno.
          </p>
        </div>
        <Button variant="secondary" onClick={() => router.push("/dashboard/schedule/shifts")} className="flex items-center gap-2 self-start">
          <ArrowLeft className="size-4" />
          Volver a turnos
        </Button>
      </div>

      <form onSubmit={handleSave} className="w-full min-w-0">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 space-y-6 bg-card border-border shadow-sm">
              <div className="border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">1. Información básica</h3>
                <p className="text-xs text-muted-foreground">Nombre y estado del turno.</p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <FieldFrame label="Nombre del Turno" hint="Nombre identificador. Ejemplo: Turno Mañana Administrativo.">
                    <Input
                      type="text"
                      placeholder="Ej. Administrativo Turno Mañana"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      required
                    />
                  </FieldFrame>
                </div>
                <FieldFrame label="Estado del Turno">
                  <Select
                    value={formData.is_active ? "true" : "false"}
                    onChange={(e) => handleChange("is_active", e.target.value === "true")}
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </Select>
                </FieldFrame>
              </div>
            </Card>

            <Card className="p-6 space-y-6 bg-card border-border shadow-sm">
              <div className="border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">2. Horario de jornada</h3>
                <p className="text-xs text-muted-foreground">Horas de entrada, salida y zona horaria.</p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <FieldFrame label="Hora de Entrada" hint="Usa formato 24 horas. Ejemplo: 08:00">
                  <Input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => handleChange("start_time", e.target.value)}
                    required
                  />
                </FieldFrame>
                <FieldFrame label="Hora de Salida" hint="Usa formato 24 horas. Ejemplo: 17:00">
                  <Input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => handleChange("end_time", e.target.value)}
                    required
                  />
                </FieldFrame>
                <FieldFrame label="Zona Horaria del Turno" hint="Zona de marcación para este turno.">
                  <Select
                    value={formData.timezone}
                    onChange={(e) => handleChange("timezone", e.target.value)}
                    required
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </Select>
                </FieldFrame>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border">
                  <Info className="size-4 text-muted-foreground shrink-0" />
                  <div className="text-sm">
                    <span className="text-muted-foreground">Duración total: </span>
                    <span className="font-semibold text-foreground">{formatMinutesToHours(duration)}</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-6 bg-card border-border shadow-sm">
              <div className="border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">3. Descanso y horas efectivas</h3>
                <p className="text-xs text-muted-foreground">Configuración de break y cálculo de horas efectivas.</p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <FieldFrame label="Tiempo de Break (minutos)" hint="Minutos de almuerzo/descanso permitidos.">
                  <Input
                    type="number"
                    min="0"
                    value={formData.break_minutes}
                    onChange={(e) => handleChange("break_minutes", parseInt(e.target.value) || 0)}
                    required
                  />
                </FieldFrame>
                <FieldFrame label="¿Break Pagado?">
                  <Select
                    value={formData.break_paid ? "true" : "false"}
                    onChange={(e) => handleChange("break_paid", e.target.value === "true")}
                  >
                    <option value="false">No pagado (descontar de jornada)</option>
                    <option value="true">Sí pagado (dentro de horas laboradas)</option>
                  </Select>
                </FieldFrame>
                <FieldFrame label="Minutos Efectivos Diarios" hint={`Equivale a: ${formatMinutesToHours(effectiveDaily)}`}>
                  <Input
                    type="number"
                    min="1"
                    value={formData.effective_minutes ?? 480}
                    onChange={(e) => handleChange("effective_minutes", parseInt(e.target.value) || 0)}
                    required
                  />
                </FieldFrame>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border">
                  <Coffee className="size-4 text-muted-foreground shrink-0" />
                  <div className="text-sm text-muted-foreground">
                    {formData.break_paid
                      ? "Este tiempo no se descontará de la jornada."
                      : "Este tiempo se descontará de la jornada para el cálculo de horas efectivas."}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-6 bg-card border-border shadow-sm">
              <div className="border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">4. Tolerancia y asistencia</h3>
                <p className="text-xs text-muted-foreground">Reglas de tardanza y horas extra.</p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <FieldFrame label="Tolerancia de Entrada (minutos)" hint="Minutos de gracia para llegada tarde.">
                  <Input
                    type="number"
                    min="0"
                    value={formData.tolerance_minutes}
                    onChange={(e) => handleChange("tolerance_minutes", parseInt(e.target.value) || 0)}
                    required
                  />
                </FieldFrame>
                <FieldFrame label="Permite Horas Extra">
                  <Select
                    value={formData.allows_overtime ? "true" : "false"}
                    onChange={(e) => handleChange("allows_overtime", e.target.value === "true")}
                  >
                    <option value="true">Sí (Registrar excedentes)</option>
                    <option value="false">No (Ignorar excedentes)</option>
                  </Select>
                </FieldFrame>
                <div className="sm:col-span-2 flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border">
                  <ShieldCheck className="size-4 text-muted-foreground shrink-0" />
                  <div className="text-sm text-muted-foreground">
                    La tolerancia define cuántos minutos puede llegar tarde el trabajador antes de marcar tardanza.
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-6 bg-card border-border shadow-sm">
              <div className="border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">5. Objetivo semanal</h3>
                <p className="text-xs text-muted-foreground">Minutos objetivo por semana.</p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <FieldFrame label="Minutos Objetivo Semanales" hint={`Equivale a: ${formatMinutesToHours(formData.weekly_target_minutes)}`}>
                  <Input
                    type="number"
                    min="1"
                    value={formData.weekly_target_minutes}
                    onChange={(e) => handleChange("weekly_target_minutes", parseInt(e.target.value) || 0)}
                    required
                  />
                </FieldFrame>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border">
                  <Target className="size-4 text-muted-foreground shrink-0" />
                  <div className="text-sm">
                    <span className="text-muted-foreground">Equivalente: </span>
                    <span className="font-semibold text-foreground">{formData.weekly_target_minutes} minutos = {formatMinutesToHours(formData.weekly_target_minutes)}</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-6 bg-card border-border shadow-sm">
              <div className="border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">6. Días laborales</h3>
                <p className="text-xs text-muted-foreground">Selecciona los días en los que este turno aplica.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {DAYS_OF_WEEK.map((day) => {
                  const isActive = days.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`flex size-12 items-center justify-center rounded-2xl text-sm font-semibold transition border ${
                        isActive
                          ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/20"
                          : "bg-card border-border hover:border-muted-foreground/50 text-muted-foreground"
                      }`}
                      title={day.fullName}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="p-6 space-y-6 bg-card border-border shadow-sm sticky top-6">
              <div className="border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">Resumen del turno</h3>
                <p className="text-xs text-muted-foreground">Vista previa de la configuración.</p>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Nombre</span>
                  <span className="font-semibold text-foreground truncate max-w-[150px]" title={formData.name}>
                    {formData.name || "Sin nombre"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Horario</span>
                  <span className="font-semibold text-foreground">{formData.start_time} - {formData.end_time}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Duración</span>
                  <span className="font-semibold text-foreground">{formatMinutesToHours(duration)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Break</span>
                  <span className="font-semibold text-foreground">
                    {formData.break_minutes} min {formData.break_paid ? "(Pagado)" : "(No pagado)"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Tolerancia</span>
                  <span className="font-semibold text-foreground">{formData.tolerance_minutes} min</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Objetivo semanal</span>
                  <span className="font-semibold text-foreground">{formatMinutesToHours(formData.weekly_target_minutes)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Días laborales</span>
                  <span className="font-semibold text-foreground text-right">
                    {days.length > 0
                      ? days.map((d) => DAYS_OF_WEEK.find((day) => day.value === d)?.label || d).join(" - ")
                      : "Ninguno"}
                  </span>
                </div>
              </div>

              <div className="border-t border-border/60 pt-4 space-y-2">
                <Button type="submit" disabled={createMutation.isPending} className="w-full flex items-center justify-center gap-2">
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar Turno"
                  )}
                </Button>
                <Button type="button" variant="secondary" onClick={() => router.push("/dashboard/schedule/shifts")} className="w-full">
                  Cancelar
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </PageContainer>
  );
}
