"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Settings2, Save } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { scheduleService } from "@/services/schedule.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FieldFrame, Input, Select } from "@/components/ui/fields";
import { PageLoader } from "@/components/ui/feedback";
import type { SchedulePolicy } from "@/types/schedule";
import { PageContainer } from "@/components/layout/page-container";

const DAYS_OF_WEEK = [
  { value: 1, label: "L", fullName: "Lunes" },
  { value: 2, label: "M", fullName: "Martes" },
  { value: 3, label: "M", fullName: "Miércoles" },
  { value: 4, label: "J", fullName: "Jueves" },
  { value: 5, label: "V", fullName: "Viernes" },
  { value: 6, label: "S", fullName: "Sábado" },
  { value: 7, label: "D", fullName: "Domingo" },
];

const dayMapToNumber: Record<string, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7,
};

const TIMEZONES = [
  { value: "America/Lima", label: "America/Lima (PET - UTC-5)" },
  { value: "America/Bogota", label: "America/Bogota (COT - UTC-5)" },
  { value: "America/Santiago", label: "America/Santiago (CLT - UTC-4)" },
  { value: "America/Mexico_City", label: "America/Mexico_City (CST - UTC-6)" },
  { value: "UTC", label: "Coordinated Universal Time (UTC)" },
];

function isValidHHmm(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function mapSchedulePolicyError(code?: string, message?: string): string {
  switch (code) {
    case "INVALID_TIME":
      return "La hora de falta automática debe tener formato HH:mm.";
    case "VALIDATION_ERROR":
      return "Revisa los datos de las políticas laborales.";
    case "UNAUTHORIZED":
      return "Tu sesión expiró. Vuelve a iniciar sesión.";
    case "FORBIDDEN":
      return "No tienes permisos para modificar políticas laborales.";
    default:
      return message ?? "No se pudieron guardar las políticas laborales.";
  }
}

export default function SchedulePoliciesPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<SchedulePolicy>({
    lateToleranceMinutes: 15,
    autoAbsenceEnabled: true,
    autoAbsenceAfterTime: "04:00",
    defaultBreakMinutes: 45,
    defaultBreakPaid: false,
    weeklyTargetMinutes: 2880,
    timezone: "America/Lima",
    workingDays: [1, 2, 3, 4, 5, 6],
  });

  const { data: policy, isLoading } = useQuery({
    queryKey: ["schedule-policies"],
    queryFn: () => scheduleService.getSchedulePolicies(),
    staleTime: 30_000,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: SchedulePolicy) => scheduleService.updateSchedulePolicies(payload),
    onSuccess: (updatedData) => {
      if (updatedData) {
        const rawDays = updatedData.workingDays || [];
        const normalizedDays = rawDays.map((d) => {
          if (typeof d === "number") return d;
          const mapped = dayMapToNumber[d.toLowerCase()];
          return mapped !== undefined ? mapped : parseInt(d) || 1;
        });
        updatedData.workingDays = normalizedDays;
        queryClient.setQueryData(["schedule-policies"], updatedData);
      }
      toast.success("Políticas de asistencia actualizadas correctamente.");
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      const backendCode = err?.code || err?.error_code || err?.errorCode || err?.error?.code;
      const msg = mapSchedulePolicyError(backendCode, err?.message);
      toast.error(msg);
    },
  });

  useEffect(() => {
    if (policy) {
      const rawDays = policy.workingDays || [];
      const normalizedDays = rawDays.map((d) => {
        if (typeof d === "number") return d;
        const mapped = dayMapToNumber[d.toLowerCase()];
        return mapped !== undefined ? mapped : parseInt(d) || 1;
      });

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        lateToleranceMinutes: policy.lateToleranceMinutes ?? 15,
        autoAbsenceEnabled: policy.autoAbsenceEnabled ?? true,
        autoAbsenceAfterTime: policy.autoAbsenceAfterTime || "04:00",
        defaultBreakMinutes: policy.defaultBreakMinutes ?? 45,
        defaultBreakPaid: policy.defaultBreakPaid ?? false,
        weeklyTargetMinutes: policy.weeklyTargetMinutes ?? 2880,
        timezone: policy.timezone || "America/Lima",
        workingDays: normalizedDays,
      });
    }
  }, [policy]);

  const toggleDay = (dayValue: number) => {
    setFormData((prev) => {
      const currentDays = (prev.workingDays || []) as number[];
      const workingDays = currentDays.includes(dayValue)
        ? currentDays.filter((d) => d !== dayValue)
        : [...currentDays, dayValue];
      
      const sortedDays = workingDays.sort((a, b) => a - b);
      
      return { ...prev, workingDays: sortedDays };
    });
  };

  const handleChange = (name: keyof SchedulePolicy, value: string | number | boolean | (string | number)[]) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (formData.lateToleranceMinutes < 0) {
      toast.error("La tolerancia no puede ser un valor negativo.");
      return;
    }
    if (formData.defaultBreakMinutes < 0) {
      toast.error("El tiempo de descanso por defecto no puede ser negativo.");
      return;
    }
    if (formData.autoAbsenceEnabled) {
      if (!formData.autoAbsenceAfterTime || !isValidHHmm(formData.autoAbsenceAfterTime)) {
        toast.error("La falta automática debe tener un formato de hora válido (HH:mm).");
        return;
      }
    }
    if (formData.weeklyTargetMinutes <= 0) {
      toast.error("Los minutos objetivo semanales deben ser mayores que cero.");
      return;
    }
    if (formData.workingDays.length === 0) {
      toast.error("Debe seleccionar al menos un día laborable.");
      return;
    }
    if (!formData.timezone) {
      toast.error("La zona horaria es obligatoria.");
      return;
    }

    updateMutation.mutate(formData);
  };

  const formatWeeklyTarget = (minutes: number) => {
    if (isNaN(minutes) || minutes <= 0) return "0 horas";
    const hours = minutes / 60;
    if (Number.isInteger(hours)) {
      return `${hours} h`;
    }
    const wholeHours = Math.floor(hours);
    const remainingMinutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours} h ${remainingMinutes} min`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <PageLoader title="Cargando políticas laborales" description="Obteniendo la configuración de horarios..." />
      </div>
    );
  }

  return (
    <PageContainer variant="wide" className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Settings2 className="size-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Políticas Laborales</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Configura las reglas globales de asistencia, tolerancia, descansos y jornada laboral de la empresa.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="w-full min-w-0">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column: Form Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card 1: Reglas de Marcación */}
            <Card className="p-6 space-y-6 bg-card border-border shadow-sm">
              <div className="border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">1. Reglas de marcación</h3>
                <p className="text-xs text-muted-foreground">Configura límites de tardanzas y registro automático de faltas.</p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <FieldFrame
                  label="Tolerancia de Entrada"
                  hint="Minutos de gracia permitidos antes de registrar tardanza."
                >
                  <div className="relative flex items-center">
                    <Input
                      type="number"
                      min="0"
                      value={formData.lateToleranceMinutes}
                      onChange={(e) => handleChange("lateToleranceMinutes", parseInt(e.target.value) || 0)}
                      required
                      className="pr-12"
                    />
                    <span className="absolute right-3 text-xs font-semibold text-muted-foreground">min</span>
                  </div>
                </FieldFrame>

                <div className="flex flex-col justify-center space-y-2">
                  <label className="text-sm font-semibold text-foreground">Falta Automática</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleChange("autoAbsenceEnabled", !formData.autoAbsenceEnabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 bg-muted ${
                        formData.autoAbsenceEnabled ? "bg-primary" : "bg-muted"
                      }`}
                      role="switch"
                      aria-checked={formData.autoAbsenceEnabled}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block size-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out translate-x-0 ${
                          formData.autoAbsenceEnabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <span className="text-sm text-muted-foreground">
                      {formData.autoAbsenceEnabled ? "Habilitada" : "Deshabilitada"}
                    </span>
                  </div>
                </div>

                {formData.autoAbsenceEnabled && (
                  <FieldFrame
                    label="Registrar falta automática después de"
                    hint="Define a qué hora de retraso acumulado se registra la falta."
                  >
                    <Input
                      type="time"
                      value={formData.autoAbsenceAfterTime}
                      onChange={(e) => handleChange("autoAbsenceAfterTime", e.target.value)}
                      required
                    />
                  </FieldFrame>
                )}
              </div>
            </Card>

            {/* Card 2: Descansos y Jornada */}
            <Card className="p-6 space-y-6 bg-card border-border shadow-sm">
              <div className="border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">2. Descansos y jornada</h3>
                <p className="text-xs text-muted-foreground">Establece los tiempos de descanso y las horas semanales esperadas.</p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <FieldFrame
                  label="Descanso por Defecto"
                  hint="Tiempo asignado por defecto para breaks en la jornada laboral."
                >
                  <div className="relative flex items-center">
                    <Input
                      type="number"
                      min="0"
                      value={formData.defaultBreakMinutes}
                      onChange={(e) => handleChange("defaultBreakMinutes", parseInt(e.target.value) || 0)}
                      className="pr-12"
                    />
                    <span className="absolute right-3 text-xs font-semibold text-muted-foreground">min</span>
                  </div>
                </FieldFrame>

                <FieldFrame
                  label="Break Pagado por Defecto"
                  hint="Establece si el tiempo de break por defecto es pagado."
                >
                  <Select
                    value={formData.defaultBreakPaid ? "true" : "false"}
                    onChange={(e) => handleChange("defaultBreakPaid", e.target.value === "true")}
                  >
                    <option value="false">No pagado (descontable)</option>
                    <option value="true">Sí pagado (remunerado)</option>
                  </Select>
                </FieldFrame>

                <FieldFrame
                  label="Minutos Objetivo Semanales"
                  hint={`Equivale a: ${formatWeeklyTarget(formData.weeklyTargetMinutes)} por semana`}
                >
                  <div className="relative flex items-center">
                    <Input
                      type="number"
                      min="1"
                      value={formData.weeklyTargetMinutes}
                      onChange={(e) => handleChange("weeklyTargetMinutes", parseInt(e.target.value) || 0)}
                      required
                      className="pr-12"
                    />
                    <span className="absolute right-3 text-xs font-semibold text-muted-foreground">min</span>
                  </div>
                </FieldFrame>
              </div>
            </Card>

            {/* Card 3: Operación */}
            <Card className="p-6 space-y-6 bg-card border-border shadow-sm">
              <div className="border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">3. Operación</h3>
                <p className="text-xs text-muted-foreground">Configura los husos horarios y la semana laboral de la empresa.</p>
              </div>

              <div className="grid gap-6">
                <FieldFrame
                  label="Zona Horaria de Operación"
                  hint="Huso horario oficial para la programación de horarios."
                >
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

                <div className="space-y-3">
                  <div className="grid gap-1">
                    <label className="text-sm font-semibold text-foreground">Días Laborales de la Empresa</label>
                    <span className="text-xs text-muted-foreground">
                      Selecciona los días hábiles en los cuales se espera laborar de forma genérica.
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day) => {
                      const isActive = formData.workingDays.includes(day.value);
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDay(day.value)}
                          className={`flex size-11 items-center justify-center rounded-2xl text-sm font-semibold transition border ${
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
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Real-time Preview Panel */}
          <div className="lg:col-span-1">
            <Card className="p-6 space-y-6 bg-card border-border shadow-sm sticky top-6">
              <div className="border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">Resumen de política</h3>
                <p className="text-xs text-muted-foreground">Vista previa de las reglas actuales.</p>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Tolerancia</span>
                  <span className="font-semibold text-foreground">{formData.lateToleranceMinutes} min</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Falta automática</span>
                  <span className="font-semibold text-foreground text-right">
                    {formData.autoAbsenceEnabled
                      ? `Activa después de ${formData.autoAbsenceAfterTime}`
                      : "Deshabilitada"}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Descanso</span>
                  <span className="font-semibold text-foreground">{formData.defaultBreakMinutes} min</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Break</span>
                  <span className="font-semibold text-foreground">
                    {formData.defaultBreakPaid ? "Pagado" : "No pagado"}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Jornada semanal</span>
                  <span className="font-semibold text-foreground">
                    {formatWeeklyTarget(formData.weeklyTargetMinutes)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Días laborales</span>
                  <span className="font-semibold text-foreground text-right">
                    {formData.workingDays.length > 0
                      ? formData.workingDays.map((d) => DAYS_OF_WEEK.find((day) => day.value === d)?.label || d).join(" - ")
                      : "Ninguno"}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Zona horaria</span>
                  <span className="font-semibold text-foreground truncate max-w-[150px]" title={formData.timezone}>
                    {formData.timezone}
                  </span>
                </div>
              </div>

              <div className="border-t border-border/60 pt-4">
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {updateMutation.isPending ? (
                    <>
                      <div className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="size-4" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </PageContainer>
  );
}
