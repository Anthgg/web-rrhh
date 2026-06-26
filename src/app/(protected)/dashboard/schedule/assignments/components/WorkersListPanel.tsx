"use client";

import { useMemo } from "react";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/fields";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import type { WorkerRecord } from "@/types";
import type { ScheduleAssignment } from "@/types/schedule";

interface WorkersListPanelProps {
  workersList: WorkerRecord[];
  assignments: ScheduleAssignment[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  statusFilter: "all" | "active" | "inactive" | "with_shift" | "without_shift";
  setStatusFilter: (val: "all" | "active" | "inactive" | "with_shift" | "without_shift") => void;
  selectedWorkerId: string;
  onSelectWorker: (id: string) => void;
}

export function WorkersListPanel({
  workersList,
  assignments,
  isLoading,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  selectedWorkerId,
  onSelectWorker,
}: WorkersListPanelProps) {
  
  const filteredWorkers = useMemo(() => {
    return workersList.filter((w) => {
      // 1. Search Filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!w.fullName?.toLowerCase().includes(query) && !w.documentNumber?.includes(query)) {
          return false;
        }
      }

      // 2. Status Filter
      const isActive = w.status === "active";
      const hasShift = assignments.some(a => a.worker_id === w.id && a.is_active);

      switch (statusFilter) {
        case "active":
          if (!isActive) return false;
          break;
        case "inactive":
          if (isActive) return false;
          break;
        case "with_shift":
          if (!hasShift) return false;
          break;
        case "without_shift":
          if (hasShift) return false;
          break;
        case "all":
        default:
          break;
      }
      return true;
    });
  }, [workersList, assignments, searchQuery, statusFilter]);

  // 9. Agregar logs temporales (cantidad después de filtros)
  console.log("=== WorkersListPanel DEBUG ===");
  console.log("filteredWorkers.length:", filteredWorkers.length);

  return (
    <div className="flex flex-col h-full bg-card rounded-[16px] border border-border/40 shadow-sm overflow-hidden">
      {/* Panel Header Sticky */}
      <div className="p-5 border-b border-border/40 bg-card/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
        <h2 className="text-sm font-bold text-foreground mb-4 flex items-center justify-between">
          <span className="uppercase tracking-wider">Colaboradores</span>
          <Badge variant="secondary" className="font-mono text-xs bg-muted/50">{filteredWorkers.length} disponibles</Badge>
        </h2>
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder="Buscar colaborador..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 w-full bg-muted/30 border-transparent focus:bg-background focus:border-primary/30 transition-all rounded-xl"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full h-10 pl-9 pr-8 text-sm rounded-xl border border-transparent bg-muted/30 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all appearance-none cursor-pointer text-muted-foreground"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Solo Activos</option>
              <option value="inactive">Solo Inactivos</option>
              <option value="with_shift">Con turno asignado</option>
              <option value="without_shift">Sin turno asignado</option>
            </select>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-5 space-y-4">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="size-12 rounded-full bg-muted"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                  <div className="h-2 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredWorkers.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center h-full">
            <Search className="size-8 text-muted-foreground/30 mb-4" />
            <p className="text-sm font-semibold text-foreground mb-1">Sin resultados</p>
            <p className="text-xs text-muted-foreground">No se encontraron colaboradores con ese criterio.</p>
            {(searchQuery || statusFilter !== "all") && (
              <button 
                onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}
                className="mt-4 text-xs font-medium text-primary hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="p-3 space-y-1.5">
            {filteredWorkers.map((worker) => {
              const isSelected = selectedWorkerId === worker.id;
              const hasShift = assignments.some(a => a.worker_id === worker.id && a.is_active);
              const displayName = worker.fullName ? worker.fullName : "Trabajador sin nombre";
              const isProfileIncomplete = !worker.documentNumber || (!worker.roleName && !worker.positionName);

              return (
                <button
                  key={worker.id}
                  onClick={() => onSelectWorker(isSelected ? "" : worker.id)}
                  className={cn(
                    "w-full flex items-center gap-4 p-3.5 text-left rounded-2xl transition-all border outline-none focus-visible:ring-2 focus-visible:ring-primary/50 relative overflow-hidden group",
                    isSelected 
                      ? "bg-primary/5 border-primary/30 shadow-sm" 
                      : "bg-transparent border-transparent hover:bg-muted/40 hover:border-border/60"
                  )}
                >
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                  )}
                  
                  <UserAvatar
                    src={worker.profilePhotoUrl || (worker as any).avatarUrl || undefined}
                    fullName={displayName}
                    size="lg"
                    className={cn("shrink-0 transition-transform duration-300", isSelected ? "scale-105 shadow-sm" : "group-hover:scale-105")}
                  />
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-0.5">
                      <p className={cn("text-sm font-bold truncate transition-colors", isSelected ? "text-primary" : "text-foreground")}>
                        {displayName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {worker.positionName || worker.roleName || "Sin rol configurado"}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant={worker.status === "active" ? "success" : "secondary"} className={cn("text-[9px] px-1.5 py-0 uppercase font-bold", worker.status === "active" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "")}>
                        {worker.status === "active" ? "Activo" : "Inactivo"}
                      </Badge>
                      {isProfileIncomplete && (
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-amber-500/15 text-amber-700 dark:text-amber-400 uppercase font-bold">
                          Incompleto
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    {hasShift && (
                      <div className="flex items-center justify-center size-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" title="Tiene turno activo">
                        <div className="size-1.5 rounded-full bg-current" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
