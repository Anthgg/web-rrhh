import { useState, useRef, useEffect } from "react";
import { Search, Filter, X } from "lucide-react";
import { Input, Select } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

interface UsersFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  role: string;
  onRoleChange: (val: string) => void;
  status: string;
  onStatusChange: (val: string) => void;
  linkStatus: string; // New filter for "Vinculación laboral"
  onLinkStatusChange: (val: string) => void;
}

export function UsersFilters({
  search,
  onSearchChange,
  role,
  onRoleChange,
  status,
  onStatusChange,
  linkStatus,
  onLinkStatusChange,
}: UsersFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowAdvanced(false);
      }
    };
    if (showAdvanced) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showAdvanced]);

  const activeAdvancedFiltersCount = (linkStatus ? 1 : 0);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
          <Input
            value={search}
            placeholder="Buscar por nombre, correo, rol, cargo o proyecto..."
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10"
          />
        </div>

        {/* Basic Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-[160px]">
            <Select value={role} onChange={(e) => onRoleChange(e.target.value)}>
              <option value="">Todos los roles</option>
              <option value="admin">Administrador</option>
              <option value="supervisor">Supervisor</option>
              <option value="worker">Trabajador</option>
              <option value="hr">RR.HH.</option>
              <option value="none">Sin rol informado</option>
            </Select>
          </div>

          <div className="w-[140px]">
            <Select value={status} onChange={(e) => onStatusChange(e.target.value)}>
              <option value="">Cualquier estado</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </Select>
          </div>

          <div className="relative" ref={popoverRef}>
            <Button
              variant={activeAdvancedFiltersCount > 0 ? "primary" : "secondary"}
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="gap-2"
            >
              <Filter className="size-4" />
              <span className="hidden sm:inline">Más filtros</span>
              {activeAdvancedFiltersCount > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-white text-xs font-bold text-brand">
                  {activeAdvancedFiltersCount}
                </span>
              )}
            </Button>

            {/* Advanced Filters Popover */}
            {showAdvanced && (
              <div className="absolute right-0 top-full z-50 mt-2 w-72 origin-top-right rounded-2xl border border-border bg-white p-4 shadow-xl animate-in fade-in zoom-in-95">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="font-semibold text-ink">Filtros Avanzados</h4>
                  <button
                    onClick={() => setShowAdvanced(false)}
                    className="rounded-full p-1 text-ink-soft transition-colors hover:bg-slate-100"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-ink-soft">Vinculación laboral</label>
                    <Select value={linkStatus} onChange={(e) => onLinkStatusChange(e.target.value)}>
                      <option value="">Todos</option>
                      <option value="with_record">Con ficha laboral</option>
                      <option value="without_record">Sin ficha laboral</option>
                      <option value="with_project">Con proyecto asignado</option>
                      <option value="without_project">Sin proyecto asignado</option>
                    </Select>
                  </div>

                  {/* Future filters could go here */}

                  <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
                    <Button
                      variant="secondary"
                      className="h-9 rounded-xl px-3 text-xs"
                      onClick={() => {
                        onLinkStatusChange("");
                        setShowAdvanced(false);
                      }}
                    >
                      Limpiar
                    </Button>
                    <Button className="h-9 rounded-xl px-3 text-xs" onClick={() => setShowAdvanced(false)}>
                      Aplicar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Active filters chips */}
      {activeAdvancedFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <span className="text-xs text-ink-soft">Filtros activos:</span>
          {linkStatus && (
            <Badge variant="secondary" className="gap-1 rounded-md px-2 py-1 font-normal">
              Vinculación: {
                linkStatus === "with_record" ? "Con ficha laboral" : 
                linkStatus === "without_record" ? "Sin ficha laboral" : 
                linkStatus === "with_project" ? "Con proyecto asignado" : 
                linkStatus === "without_project" ? "Sin proyecto asignado" : linkStatus
              }
              <X 
                className="ml-1 size-3 cursor-pointer text-slate-400 hover:text-slate-600" 
                onClick={() => onLinkStatusChange("")} 
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
