"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, ShieldAlert, AlertCircle } from "lucide-react";

import { scheduleService } from "@/services/schedule.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/fields";
import { PageLoader } from "@/components/ui/feedback";
import { Badge } from "@/components/ui/badge";

const translateDayName = (dayName: string | undefined | null) => {
  if (!dayName) return "";
  const nameMap: Record<string, string> = {
    monday: "Lunes",
    tuesday: "Martes",
    wednesday: "Miércoles",
    thursday: "Jueves",
    friday: "Viernes",
    saturday: "Sábado",
    sunday: "Domingo"
  };
  return nameMap[dayName.toLowerCase().trim()] || dayName;
};

export function ProfileScheduleTab() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().substring(0, 10));

  const { data: schedule, isLoading, isError, refetch } = useQuery({
    queryKey: ["my-schedule-detail", selectedDate],
    queryFn: () => scheduleService.getMySchedule(selectedDate),
    enabled: Boolean(selectedDate),
    staleTime: 0,
    gcTime: 0,
  });

  const formatDateLabel = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <Card className="p-4 bg-card border-border flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shadow-sm">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">Consulta de Jornada Diaria</h3>
          <p className="text-xs text-muted-foreground">
            Selecciona una fecha para verificar tu horario, tolerancias y descansos programados.
          </p>
        </div>
        <div className="w-full sm:w-48">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-10 text-xs w-full"
            required
          />
        </div>
      </Card>

      {isLoading ? (
        <Card className="p-8">
          <PageLoader title="Consultando tu horario" description="Recuperando la programación de tu jornada..." />
        </Card>
      ) : isError ? (
        <Card className="flex flex-col items-center justify-center min-h-[260px] border border-destructive/20 bg-destructive/5 text-center p-6">
          <div className="rounded-full bg-destructive/10 p-3 text-destructive mb-3">
            <ShieldAlert className="size-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Error al recuperar tu horario</h3>
          <p className="text-muted-foreground text-sm max-w-sm mt-1">
            No se pudo establecer conexión con el servidor para consultar tu horario.
          </p>
          <Button onClick={() => refetch()} className="mt-4" variant="secondary">
            Reintentar
          </Button>
        </Card>
      ) : !schedule || !schedule.shift ? (
        <Card className="flex flex-col items-center justify-center min-h-[260px] border border-dashed border-border bg-card text-center p-6">
          <div className="rounded-full bg-amber-500/10 p-4 text-amber-500 mb-3">
            <AlertCircle className="size-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">No tienes horario asignado para esta fecha</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {schedule?.isWorkingDay === false
                ? "Esta fecha está programada como tu día de descanso."
                : "No se encontró ningún turno activo asignado a tu cuenta para esta fecha."}
            </p>
          </div>
          <div className="mt-4 text-xs font-medium text-foreground">
            {formatDateLabel(selectedDate)}
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <span>Mostrando jornada correspondiente al:</span>
            <strong className="text-foreground">
              {schedule.dayName ? `${translateDayName(schedule.dayName)}, ` : ""}{formatDateLabel(selectedDate)}
            </strong>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Tarjeta Principal: Horario de Entrada/Salida */}
            <Card className="p-6 bg-card border-border shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Mi Jornada Laboral</h3>
                  </div>
                  <Badge variant="success">Asignado</Badge>
                </div>

                <div className="mt-4 space-y-1">
                  <p className="text-xs text-muted-foreground">Turno:</p>
                  <h4 className="text-lg font-bold text-foreground">{schedule.shift.name}</h4>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-muted/40 p-3 rounded-2xl border border-border/40">
                    <p className="text-[11px] text-muted-foreground uppercase font-semibold">Entrada</p>
                    <p className="text-xl font-bold text-foreground mt-1">
                      {schedule.shift.start_time.substring(0, 5)}
                    </p>
                  </div>
                  <div className="bg-muted/40 p-3 rounded-2xl border border-border/40">
                    <p className="text-[11px] text-muted-foreground uppercase font-semibold">Salida</p>
                    <p className="text-xl font-bold text-foreground mt-1">
                      {schedule.shift.end_time.substring(0, 5)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-border/40 pt-4 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Zona horaria:</span>
                <span className="font-semibold text-foreground">{schedule.shift.timezone}</span>
              </div>
            </Card>

            {/* Tarjeta Detalle de Reglas Asignadas */}
            <Card className="p-6 bg-card border-border shadow-sm space-y-5">
              <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                <Clock className="size-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Reglas y Tolerancia</h3>
              </div>

              <div className="space-y-4 text-sm">
                {schedule.dayName && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Día de la semana:</span>
                    <span className="font-semibold text-foreground">
                      {translateDayName(schedule.dayName)} {schedule.dayOfWeek ? `(Día ${schedule.dayOfWeek})` : ""}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tolerancia de ingreso:</span>
                  <span className="font-semibold text-foreground">{schedule.shift.tolerance_minutes} minutos</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tiempo de descanso (Break):</span>
                  <span className="font-semibold text-foreground">{schedule.shift.break_minutes} minutos</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Break pagado:</span>
                  <span className="font-semibold text-foreground">
                    {schedule.shift.break_paid ? "Sí (Dentro de jornada)" : "No (Descontable)"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tipo de Día:</span>
                  <Badge variant={schedule.isWorkingDay ? "info" : "secondary"}>
                    {schedule.isWorkingDay ? "Laborable" : "No Laborable / Descanso"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Permite Horas Extra:</span>
                  <span className="font-semibold text-foreground">
                    {schedule.shift.allows_overtime ? "Habilitado" : "Deshabilitado"}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
