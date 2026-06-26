"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { holidaysService } from "@/services/holidays.service";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { Input, FieldFrame } from "@/components/ui/fields";
import { 
  Calendar, Plus, Pencil, Trash2, CheckCircle2, 
  XCircle, AlertCircle, Search, CalendarDays, 
  X, AlertTriangle, Power
} from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/layout/page-container";
import { cn } from "@/lib/utils/cn";

// Utils for dates
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function parseLocalDate(dateString: string): Date {
  const ymd = dateString.split("T")[0]; // YYYY-MM-DD
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatFriendlyDate(dateString: string) {
  const d = parseLocalDate(dateString);
  const day = String(d.getDate()).padStart(2, "0");
  const month = MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

function getDayOfWeek(dateString: string) {
  const d = parseLocalDate(dateString);
  return DAYS[d.getDay()];
}

function toInputDateString(dateString: string) {
  return dateString.split("T")[0];
}

export default function HolidaysPage() {
  const queryClient = useQueryClient();
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHolidayId, setEditingHolidayId] = useState<string | null>(null);
  
  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; id: string; isActive: boolean; name: string } | null>(null);
  
  // Form State
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "active", "inactive"
  const [yearFilter, setYearFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("asc"); // "asc", "desc"

  const { data: holidaysResponse, isLoading, isError, refetch } = useQuery({
    queryKey: ["holidays"],
    queryFn: () => holidaysService.list(),
  });

  const holidays = holidaysResponse?.data || [];

  // Derived Data
  const { filteredHolidays, summary, availableYears } = useMemo(() => {
    // Available years
    const years = new Set<number>();
    holidays.forEach((h: any) => years.add(parseLocalDate(h.date).getFullYear()));
    const sortedYears = Array.from(years).sort((a, b) => b - a);

    // Summary
    const total = holidays.length;
    const active = holidays.filter((h: any) => h.is_active).length;
    const inactive = total - active;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingHolidays = holidays
      .filter((h: any) => h.is_active && parseLocalDate(h.date) >= today)
      .sort((a: any, b: any) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime());
    
    const nextHoliday = upcomingHolidays.length > 0 ? upcomingHolidays[0] : null;

    // Filter
    let filtered = [...holidays];

    if (searchQuery) {
      filtered = filtered.filter((h: any) => h.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((h: any) => statusFilter === "active" ? h.is_active : !h.is_active);
    }

    if (yearFilter !== "all") {
      filtered = filtered.filter((h: any) => parseLocalDate(h.date).getFullYear().toString() === yearFilter);
    }

    // Sort
    filtered.sort((a: any, b: any) => {
      const timeA = parseLocalDate(a.date).getTime();
      const timeB = parseLocalDate(b.date).getTime();
      return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
    });

    return { 
      filteredHolidays: filtered, 
      summary: { total, active, inactive, nextHoliday },
      availableYears: sortedYears 
    };
  }, [holidays, searchQuery, statusFilter, yearFilter, sortOrder]);

  const resetForm = () => {
    setName("");
    setDate("");
    setIsActive(true);
    setEditingHolidayId(null);
    setIsModalOpen(false);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (holiday: any) => {
    setEditingHolidayId(holiday.id);
    setName(holiday.name);
    setDate(toInputDateString(holiday.date));
    setIsActive(holiday.is_active);
    setIsModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      if (editingHolidayId) {
        return holidaysService.update(editingHolidayId, { name, date, is_active: isActive });
      }
      return holidaysService.create({ name, date, is_active: isActive });
    },
    onSuccess: () => {
      toast.success(editingHolidayId ? "Feriado actualizado exitosamente" : "Feriado creado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al guardar el feriado");
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      holidaysService.toggleActive(id, is_active),
    onSuccess: (_, variables) => {
      toast.success(`Feriado ${variables.is_active ? "activado" : "desactivado"} exitosamente`);
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      setConfirmDialog(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al cambiar estado del feriado");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || name.length < 3) {
      toast.error("El nombre de la festividad debe tener al menos 3 caracteres.");
      return;
    }
    if (!date) {
      toast.error("Debes seleccionar una fecha.");
      return;
    }
    saveMutation.mutate();
  };

  return (
    <PageContainer>
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CalendarDays className="size-6 text-primary" />
            Feriados Nacionales
          </h1>
          <p className="text-muted-foreground mt-1 text-sm max-w-xl">
            Administra los días festivos que afectan la asistencia, faltas y planillas de la empresa.
            <span className="block mt-0.5 text-xs text-muted-foreground/80">Los feriados activos no deben generar falta si el trabajador no marca asistencia.</span>
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="flex items-center gap-2 shrink-0 shadow-sm hover:shadow transition-shadow">
          <Plus className="size-4" />
          Nuevo feriado
        </Button>
      </div>

      {isError && (
        <div className="mb-6 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/50 flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="size-5 shrink-0" />
            <p className="text-sm font-medium">No se pudieron cargar los feriados. Verifica tu conexión o intenta nuevamente.</p>
          </div>
          <Button variant="secondary" onClick={() => refetch()} className="shrink-0 bg-white dark:bg-transparent h-9 px-4">
            Reintentar
          </Button>
        </div>
      )}

      {/* 2. Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border/60 shadow-sm rounded-xl p-5 flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total de feriados</span>
          {isLoading ? <div className="h-8 w-16 bg-muted animate-pulse rounded mt-1"></div> : (
            <span className="text-2xl font-bold text-foreground">{summary.total}</span>
          )}
        </div>
        <div className="bg-card border border-border/60 shadow-sm rounded-xl p-5 flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Feriados activos</span>
          {isLoading ? <div className="h-8 w-16 bg-muted animate-pulse rounded mt-1"></div> : (
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">{summary.active}</span>
          )}
        </div>
        <div className="bg-card border border-border/60 shadow-sm rounded-xl p-5 flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Feriados inactivos</span>
          {isLoading ? <div className="h-8 w-16 bg-muted animate-pulse rounded mt-1"></div> : (
            <span className="text-2xl font-bold text-muted-foreground">{summary.inactive}</span>
          )}
        </div>
        <div className="bg-card border border-border/60 shadow-sm rounded-xl p-5 flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Próximo feriado</span>
          {isLoading ? <div className="h-8 w-full bg-muted animate-pulse rounded mt-1"></div> : (
            summary.nextHoliday ? (
              <div>
                <div className="text-sm font-bold text-foreground truncate" title={summary.nextHoliday.name}>{summary.nextHoliday.name}</div>
                <div className="text-xs text-primary font-medium mt-0.5">{formatFriendlyDate(summary.nextHoliday.date)}</div>
              </div>
            ) : (
              <span className="text-sm font-medium text-muted-foreground mt-1">Sin próximos feriados</span>
            )
          )}
        </div>
      </div>

      {/* 4. Toolbar / Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 items-center justify-between bg-card p-3 rounded-xl border border-border/60 shadow-sm">
        <div className="relative w-full sm:w-80 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Buscar por nombre de festividad..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-w-[120px]"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Solo Activos</option>
            <option value="inactive">Solo Inactivos</option>
          </select>
          <select 
            value={yearFilter} 
            onChange={(e) => setYearFilter(e.target.value)}
            className="h-10 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-w-[100px]"
          >
            <option value="all">Cualquier año</option>
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <select 
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value)}
            className="h-10 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-w-[160px]"
          >
            <option value="asc">Más próximos primero</option>
            <option value="desc">Más lejanos primero</option>
          </select>
        </div>
      </div>

      {/* 3. Table */}
      <div className="bg-card rounded-xl border border-border/60 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <CalendarDays className="size-10 text-muted-foreground/30 animate-pulse mb-4" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded mb-2"></div>
            <div className="h-3 w-48 bg-muted/60 animate-pulse rounded"></div>
          </div>
        ) : holidays.length === 0 ? (
          /* 5. Empty State (No data) */
          <div className="p-16 text-center flex flex-col items-center justify-center max-w-md mx-auto">
            <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <Calendar className="size-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No hay feriados registrados</h3>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              Agrega los feriados nacionales para que el sistema calcule correctamente asistencia, faltas y pagos especiales.
            </p>
            <Button onClick={handleOpenCreate} className="flex items-center gap-2">
              <Plus className="size-4" />
              Agregar primer feriado
            </Button>
          </div>
        ) : filteredHolidays.length === 0 ? (
          /* Empty State (No results for filter) */
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <Search className="size-10 text-muted-foreground/30 mb-4" />
            <h3 className="text-base font-bold text-foreground mb-1">Sin resultados</h3>
            <p className="text-muted-foreground text-sm mb-4">
              No se encontraron feriados con los filtros aplicados.
            </p>
            <Button variant="secondary" onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
              setYearFilter("all");
            }}>
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Desktop Table view */}
            <table className="w-full text-sm text-left hidden md:table">
              <thead className="bg-muted/30 text-muted-foreground text-[11px] uppercase tracking-wider font-semibold border-b border-border/60">
                <tr>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Festividad</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredHolidays.map((holiday: any) => (
                  <tr key={holiday.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{formatFriendlyDate(holiday.date)}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{getDayOfWeek(holiday.date)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground max-w-[300px] truncate" title={holiday.name}>
                        {holiday.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {holiday.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                          <CheckCircle2 className="size-3.5" /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-600 border border-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
                          <XCircle className="size-3.5" /> Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-1">
                      <Button 
                        variant="ghost" 
                        onClick={() => handleOpenEdit(holiday)}
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                        title="Editar feriado"
                      >
                        <Pencil className="size-4 text-muted-foreground hover:text-foreground" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        onClick={() => setConfirmDialog({ id: holiday.id, isActive: holiday.is_active, name: holiday.name, isOpen: true })}
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                        title={holiday.is_active ? "Desactivar feriado" : "Activar feriado"}
                      >
                        {holiday.is_active ? (
                          <Power className="size-4 text-rose-500 hover:text-rose-600" />
                        ) : (
                          <CheckCircle2 className="size-4 text-emerald-500 hover:text-emerald-600" />
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Cards view */}
            <div className="md:hidden flex flex-col divide-y divide-border/60">
              {filteredHolidays.map((holiday: any) => (
                <div key={holiday.id} className="p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-foreground text-sm">{holiday.name}</div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                        <Calendar className="size-3" />
                        {formatFriendlyDate(holiday.date)} ({getDayOfWeek(holiday.date)})
                      </div>
                    </div>
                    {holiday.is_active ? (
                      <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                        Activo
                      </span>
                    ) : (
                      <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
                        Inactivo
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                    <Button variant="secondary" onClick={() => handleOpenEdit(holiday)} className="h-8 text-xs px-3">
                      Editar
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={() => setConfirmDialog({ id: holiday.id, isActive: holiday.is_active, name: holiday.name, isOpen: true })}
                      className={cn("h-8 text-xs px-3", holiday.is_active ? "text-rose-600 border-rose-200 hover:bg-rose-50" : "text-emerald-600 border-emerald-200 hover:bg-emerald-50")}
                    >
                      {holiday.is_active ? "Desactivar" : "Activar"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 6. Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border/50 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-border/50 bg-muted/20">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {editingHolidayId ? "Editar feriado" : "Nuevo feriado"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {editingHolidayId ? "Actualiza la fecha, nombre o estado del feriado seleccionado." : "Registra un día festivo para excluirlo del cálculo de faltas."}
                </p>
              </div>
              <button onClick={resetForm} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors">
                <X className="size-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              <FieldFrame label="Fecha del feriado" hint="Selecciona el día exacto en el calendario.">
                <Input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  required 
                  className="w-full"
                />
              </FieldFrame>
              <FieldFrame label="Nombre de festividad" hint="Mínimo 3 caracteres. Máximo 80.">
                <Input 
                  type="text" 
                  placeholder="Ej. Día del Trabajo" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  minLength={3}
                  maxLength={80}
                  className="w-full"
                />
              </FieldFrame>

              <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-border/50 bg-muted/20">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">Feriado activo</span>
                  <span className="text-xs text-muted-foreground mt-0.5">Si está activo, este día no generará falta automática.</span>
                </div>
                {/* Switch checkbox */}
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* 7. Modal Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                <Button type="button" variant="ghost" onClick={resetForm} disabled={saveMutation.isPending}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveMutation.isPending} className="min-w-[140px]">
                  {saveMutation.isPending ? "Guardando..." : (editingHolidayId ? "Guardar cambios" : "Guardar feriado")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. Confirm Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-sm rounded-2xl shadow-xl border border-border/50 p-6 animate-in zoom-in-95 duration-200">
            <div className={cn("size-12 rounded-full flex items-center justify-center mb-4", confirmDialog.isActive ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600")}>
              <AlertTriangle className="size-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              {confirmDialog.isActive ? "¿Desactivar feriado?" : "¿Activar feriado?"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {confirmDialog.isActive 
                ? `El feriado "${confirmDialog.name}" dejará de excluirse del cálculo de faltas y asistencia. Los trabajadores podrían ser evaluados como día laboral.` 
                : `El día "${confirmDialog.name}" será considerado feriado y no generará falta si el trabajador no marca asistencia.`}
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setConfirmDialog(null)} disabled={toggleStatusMutation.isPending}>
                Cancelar
              </Button>
              <Button 
                variant={confirmDialog.isActive ? "danger" : "primary"} 
                onClick={() => toggleStatusMutation.mutate({ id: confirmDialog.id, is_active: !confirmDialog.isActive })}
                disabled={toggleStatusMutation.isPending}
                className={!confirmDialog.isActive ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
              >
                {toggleStatusMutation.isPending ? "Procesando..." : (confirmDialog.isActive ? "Desactivar" : "Activar")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
