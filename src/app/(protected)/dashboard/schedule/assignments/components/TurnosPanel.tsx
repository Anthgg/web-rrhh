"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarDays, Save, UserCheck, Clock, AlertTriangle, User, Search } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { scheduleService } from "@/services/schedule.service";
import type { Shift, ScheduleAssignmentPayload } from "@/types/schedule";

import { ShiftCard } from "./ShiftCard";

interface TurnosPanelProps {
  selectedWorkerId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  workersList: any[];
  shifts: Shift[];
}

export function TurnosPanel({
  selectedWorkerId,
  workersList,
  shifts,
}: TurnosPanelProps) {
  const queryClient = useQueryClient();
  const selectedWorker = workersList?.find((w) => w.id === selectedWorkerId);

  const getLocalISODate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const [selectedShiftId, setSelectedShiftId] = useState("");
  const [startDate, setStartDate] = useState(getLocalISODate());
  const [endDate, setEndDate] = useState("");
  const [isPermanent, setIsPermanent] = useState(true);

  const invalidateAllScheduleQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["schedule-assignments"] });
    queryClient.invalidateQueries({ queryKey: ["schedule-active-workers-count"] });
    queryClient.invalidateQueries({ queryKey: ["schedule-active-assignments-count"] });
    queryClient.invalidateQueries({ queryKey: ["worker-schedule"] });
  };

  const assignMutation = useMutation({
    mutationFn: (data: { workerId: string; shiftId: string; startDate: string; endDate?: string }) =>
      scheduleService.assignWorkerShift(data.workerId, data.shiftId, data.startDate, data.endDate),
    onSuccess: () => {
      invalidateAllScheduleQueries();
      toast.success("Turno asignado correctamente.");
      setSelectedShiftId("");
    },
    onError: (err: any) => {
      if (err?.message?.includes("OVERLAP") || err?.code === "SCHEDULE_ASSIGNMENT_OVERLAP") {
        toast.error("Ya existe un turno en este rango o las fechas se superponen.");
      } else {
        toast.error(err.message || "Error al registrar la asignación.");
      }
    },
  });

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedWorkerId || !selectedShiftId || !startDate) {
      toast.error("Por favor completa los campos obligatorios.");
      return;
    }
    assignMutation.mutate({
      workerId: selectedWorkerId,
      shiftId: selectedShiftId,
      startDate: startDate,
      endDate: isPermanent ? undefined : endDate,
    });
  };

  const [shiftSearch, setShiftSearch] = useState("");

  const currentShift = shifts.find((s) => s.id === selectedShiftId);
  const filteredShifts = shifts.filter(s => 
    s.name.toLowerCase().includes(shiftSearch.toLowerCase())
  );

  if (!selectedWorkerId) {
    return (
      <Card className="flex flex-col items-center justify-center h-full border border-dashed border-border bg-card text-center p-6 rounded-[16px]">
        <div className="rounded-full bg-muted p-5 text-muted-foreground mb-4">
          <CalendarDays className="size-10" />
        </div>
        <h3 className="text-xl font-bold text-foreground">Selecciona un colaborador</h3>
        <p className="text-muted-foreground text-sm max-w-sm mt-2">
          Busca y selecciona un colaborador del panel izquierdo para iniciar el proceso de asignación de turno.
        </p>
      </Card>
    );
  }

  // Validaciones visuales
  const today = getLocalISODate();
  const isPastDate = startDate < today;
  // const hasActiveShift = false; // Se podría derivar si se pasaran las asignaciones actuales

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 h-full min-h-0">
      {/* Columna 2: Configuración (Formulario) */}
      <Card className="flex flex-col h-full bg-card rounded-[16px] border border-border/40 shadow-sm overflow-hidden min-h-0">
        <div className="p-6 border-b border-border/40 bg-card/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
          <h2 className="text-xl font-bold text-foreground">Configuración del Turno</h2>
          <p className="text-sm text-muted-foreground mt-1">Completa los pasos para asignar el horario de trabajo.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-10 min-h-0">
          
          {/* PASO 1: Colaborador */}
          <section className="space-y-4 shrink-0">
            <div className="flex items-center gap-3">
              <span className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                1
              </span>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Colaborador</h3>
            </div>
            
            <div className="flex items-center gap-5 p-5 rounded-2xl border border-border/60 bg-muted/10 shadow-sm">
              <UserAvatar
                src={selectedWorker?.avatarUrl || selectedWorker?.profilePhotoUrl}
                fullName={selectedWorker?.fullName || "Trabajador sin nombre"}
                size="xl"
                className="ring-4 ring-background shadow-md"
              />
              <div className="flex flex-col gap-1.5 min-w-0">
                <h4 className="text-lg font-bold text-foreground truncate">{selectedWorker?.fullName || "Trabajador sin nombre"}</h4>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><User className="size-4" /> {selectedWorker?.positionName || selectedWorker?.roleName || "Sin cargo"}</span>
                  <Badge variant={selectedWorker?.status === "active" ? "success" : "secondary"} className="uppercase font-bold text-[10px] px-2 py-0.5">
                    {selectedWorker?.status === "active" ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </div>
            </div>
          </section>

          {/* PASO 2: Turno */}
          <section className="space-y-4 shrink-0">
            <div className="flex items-center gap-3">
              <span className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                2
              </span>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Turno Laboral</h3>
            </div>
            
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Buscar turno por nombre..." 
                value={shiftSearch}
                onChange={(e) => setShiftSearch(e.target.value)}
                className="w-full h-11 pl-9 pr-3 rounded-xl border border-border/60 bg-muted/10 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-sm shadow-sm"
              />
            </div>
            
            <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredShifts.map(shift => (
                <button
                  key={shift.id}
                  type="button"
                  onClick={() => setSelectedShiftId(shift.id)}
                  className={`text-left w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                    selectedShiftId === shift.id 
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                      : 'border-border/60 hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${selectedShiftId === shift.id ? 'bg-primary/20 text-primary' : 'bg-muted/50 text-muted-foreground'}`}>
                      {selectedShiftId === shift.id ? <Clock className="size-4" /> : <CalendarDays className="size-4" />}
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold ${selectedShiftId === shift.id ? 'text-primary' : 'text-foreground'}`}>{shift.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {shift.start_time?.slice(0, 5)} - {shift.end_time?.slice(0, 5)} • {Math.round((shift.weekly_target_minutes ?? shift.weeklyTargetMinutes ?? 0) / 60)}h semanales
                      </p>
                    </div>
                  </div>
                  {selectedShiftId === shift.id && (
                    <div className="size-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                  )}
                </button>
              ))}
              {filteredShifts.length === 0 && (
                <div className="p-6 text-center border border-dashed rounded-xl bg-muted/10 text-muted-foreground text-sm">
                  {shiftSearch ? "No se encontraron turnos con ese nombre." : "No hay turnos disponibles para asignar."}
                </div>
              )}
            </div>
          </section>

          {/* PASO 3: Vigencia */}
          <section className="space-y-4 pb-8">
            <div className="flex items-center gap-3">
              <span className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                3
              </span>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Vigencia</h3>
            </div>
            
            <div className="p-5 rounded-2xl border border-border/60 bg-muted/10 space-y-6">
              <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border/50 shadow-sm">
                <div className="space-y-0.5">
                  <label className="text-sm font-bold text-foreground block">Asignación permanente</label>
                  <span className="text-xs text-muted-foreground">El turno no tendrá fecha de finalización automática.</span>
                </div>
                <Switch 
                  checked={isPermanent} 
                  onCheckedChange={(val) => {
                    setIsPermanent(val);
                    if (val) setEndDate("");
                  }} 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider block">Fecha de Inicio</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm"
                  />
                </div>
                
                {!isPermanent && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider block">Fecha de Fin</label>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="flex h-11 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </Card>

      {/* Columna 3: Resumen (Sticky right panel) */}
      <div className="flex flex-col h-full bg-card rounded-[16px] border border-border/40 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border/40 bg-card/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
            Resumen de asignación
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Detalles visuales */}
          <div className="space-y-4">
            <div className="flex gap-3 items-start">
              <div className="mt-0.5"><UserCheck className="size-4 text-primary" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Colaborador</p>
                <p className="text-sm font-medium text-foreground">{selectedWorker?.fullName}</p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="mt-0.5"><Clock className="size-4 text-blue-500" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Turno Seleccionado</p>
                {currentShift ? (
                  <>
                    <p className="text-sm font-medium text-foreground">{currentShift.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {currentShift.start_time?.slice(0, 5)} - {currentShift.end_time?.slice(0, 5)} ({Math.round((currentShift.weekly_target_minutes ?? currentShift.weeklyTargetMinutes ?? 0) / 60)}h sem.)
                    </p>
                    <p className="text-xs text-muted-foreground">Tolerancia: {currentShift.tolerance_minutes ?? currentShift.toleranceMinutes} min</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Ninguno seleccionado</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="mt-0.5"><CalendarDays className="size-4 text-emerald-500" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Vigencia</p>
                {startDate ? (
                  <>
                    <p className="text-sm font-medium text-foreground">Desde: {startDate}</p>
                    <p className="text-sm font-medium text-foreground mt-0.5">
                      Hasta: {isPermanent ? <span className="italic text-muted-foreground">Indefinido</span> : endDate || <span className="text-rose-500 text-xs">Falta fecha</span>}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Falta fecha inicio</p>
                )}
              </div>
            </div>
          </div>

          {/* Validaciones (Alertas) */}
          <div className="space-y-3 pt-4 border-t border-border/40">
            {isPastDate && (
              <div className="flex items-start gap-2 bg-amber-500/10 text-amber-700 dark:text-amber-400 p-3 rounded-xl border border-amber-500/20 text-xs">
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                <p>La fecha de inicio es anterior a hoy. El turno aplicará retroactivamente.</p>
              </div>
            )}
            
            {!isPermanent && startDate && endDate && endDate < startDate && (
              <div className="flex items-start gap-2 bg-rose-500/10 text-rose-700 dark:text-rose-400 p-3 rounded-xl border border-rose-500/20 text-xs">
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                <p>La fecha de fin no puede ser anterior a la fecha de inicio.</p>
              </div>
            )}
          </div>
        </div>

        {/* Botón Guardar */}
        <div className="p-5 border-t border-border/40 bg-muted/10 shrink-0">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={assignMutation.isPending || !selectedShiftId || !startDate || (!isPermanent && (!endDate || endDate < startDate))}
            className="w-full h-12 flex items-center justify-center gap-2 rounded-xl text-base shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            <Save className="size-5" />
            {assignMutation.isPending ? "Guardando..." : "Guardar Asignación"}
          </Button>
        </div>
      </div>
    </div>
  );
}
