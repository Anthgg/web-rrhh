import { useState, useRef, useEffect } from "react";
import { Filter, X } from "lucide-react";
import { Input, Select } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";

export interface AdvancedFiltersState {
  supervisor: string;
  workLocation: string;
  movedWorkersOnly: boolean;
}

interface AdvancedFiltersPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  filters: AdvancedFiltersState;
  setFilters: (filters: AdvancedFiltersState) => void;
}

export function AdvancedFiltersPopover({ isOpen, onClose, filters, setFilters }: AdvancedFiltersPopoverProps) {
  const [localFilters, setLocalFilters] = useState<AdvancedFiltersState>(filters);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync when opened
  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
    }
  }, [isOpen, filters]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleApply = () => {
    setFilters(localFilters);
    onClose();
  };

  const handleClear = () => {
    const cleared = { supervisor: "", workLocation: "", movedWorkersOnly: false };
    setLocalFilters(cleared);
    setFilters(cleared);
    onClose();
  };

  return (
    <div className="absolute top-full right-0 mt-2 z-50 w-full sm:w-80 animate-in fade-in zoom-in-95 duration-200">
      <div 
        ref={popoverRef}
        className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <Filter className="size-4 text-indigo-600" />
            Filtros Avanzados
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Supervisor</label>
            <Input 
              placeholder="Ej: Juan Pérez" 
              value={localFilters.supervisor}
              onChange={(e) => setLocalFilters({ ...localFilters, supervisor: e.target.value })}
              className="h-10 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Obra Principal</label>
            <Input 
              placeholder="Ej: Proyecto Alpha" 
              value={localFilters.workLocation}
              onChange={(e) => setLocalFilters({ ...localFilters, workLocation: e.target.value })}
              className="h-10 text-sm"
            />
          </div>

          <label className="flex items-center gap-2 mt-2 cursor-pointer group">
            <input 
              type="checkbox" 
              className="size-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
              checked={localFilters.movedWorkersOnly}
              onChange={(e) => setLocalFilters({ ...localFilters, movedWorkersOnly: e.target.checked })}
            />
            <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
              Solo cuadrillas con movimientos
            </span>
          </label>
        </div>

        <div className="flex items-center gap-3 p-4 border-t border-slate-100 bg-slate-50 justify-end">
          <Button variant="secondary" onClick={handleClear} className="text-slate-600 border-slate-200">
            Limpiar
          </Button>
          <Button onClick={handleApply} className="bg-indigo-600 hover:bg-indigo-700">
            Aplicar filtros
          </Button>
        </div>
      </div>
    </div>
  );
}
