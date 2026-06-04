"use client";

import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, X, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, FieldFrame } from "@/components/ui/fields";

import { workCrewsService, WorkCrew } from "@/services/work-crews.service";
import { workersService } from "@/services/workers.service";
import { extractArray } from "@/lib/utils/extract-array";
import { WorkerRecord } from "@/types";

import { WorkerSearchBar } from "./add-workers-modal/WorkerSearchBar";
import { WorkerFilterTabs } from "./add-workers-modal/WorkerFilterTabs";
import { AvailableWorkersList } from "./add-workers-modal/AvailableWorkersList";
import { SelectedWorkersSummary } from "./add-workers-modal/SelectedWorkersSummary";
import { ConfirmAssignmentDialog } from "./add-workers-modal/ConfirmAssignmentDialog";

// Custom hook for debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useState(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  });
  
  return debouncedValue;
}

interface AddWorkersToCrewModalProps {
  isOpen: boolean;
  onClose: () => void;
  crew: WorkCrew;
  existingWorkerIds: string[];
}

export function AddWorkersToCrewModal({
  isOpen,
  onClose,
  crew,
  existingWorkerIds,
}: AddWorkersToCrewModalProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  // Simple custom implementation of debounce since we cannot rely on useEffect running properly on initial render due to Next.js strict mode sometimes
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const [activeTab, setActiveTab] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [reason, setReason] = useState("");
  
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const workersQuery = useQuery({
    queryKey: ["workers-list", search], // React Query handles its own caching, but we pass real-time search
    queryFn: async () => {
      const res = await workersService.list({ search, pageSize: 100 });
      return extractArray<WorkerRecord>(res);
    },
    enabled: isOpen,
  });

  const allWorkers = workersQuery.data || [];
  
  // Local Filtering
  const filteredWorkers = useMemo(() => {
    let list = allWorkers;
    
    // Tab filter
    if (activeTab === "available") {
      list = list.filter(w => !w.work_location_id && !w.project && !existingWorkerIds.includes(w.id));
    } else if (activeTab === "assigned") {
      list = list.filter(w => !!w.work_location_id || !!w.project);
    }
    
    // Note: Search filter is handled server-side via React Query refetch, 
    // but we can also do it locally to be snappy if the API returns 100 records
    if (search) {
      const lowerSearch = search.toLowerCase();
      list = list.filter(w => 
        w.fullName?.toLowerCase().includes(lowerSearch) || 
        w.email?.toLowerCase().includes(lowerSearch) ||
        w.position?.toLowerCase().includes(lowerSearch)
      );
    }

    return list;
  }, [allWorkers, activeTab, search, existingWorkerIds]);

  // Derived state for summary
  const selectedWorkers = useMemo(() => {
    return allWorkers.filter(w => selectedIds.has(w.id));
  }, [allWorkers, selectedIds]);

  const toggleWorker = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const removeSelectedWorker = (id: string) => {
    const next = new Set(selectedIds);
    next.delete(id);
    setSelectedIds(next);
  };

  const mutation = useMutation({
    mutationFn: () =>
      workCrewsService.addWorkersToCrew(crew.id, Array.from(selectedIds), reason || "Asignación inicial"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-crews", crew.id, "workers"] });
      queryClient.invalidateQueries({ queryKey: ["work-crews"] });
      onClose();
    },
  });

  const handleAssignClick = () => {
    // Check if any selected worker has a conflict
    const hasConflicts = selectedWorkers.some(w => !!w.work_location_id || !!w.project);
    
    if (hasConflicts) {
      setShowConfirmDialog(true);
    } else {
      mutation.mutate();
    }
  };

  const handleConfirmAssignment = () => {
    mutation.mutate();
    setShowConfirmDialog(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
        <div className="flex w-full max-w-4xl max-h-[85vh] flex-col rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 shrink-0 bg-white">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <UsersRound className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 leading-tight">Agregar Trabajadores</h2>
                <p className="text-sm text-slate-500">
                  Selecciona trabajadores disponibles para asignarlos a <span className="font-medium text-slate-700">{crew.name}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
            {/* Search and Filters */}
            <div className="p-6 pb-2 shrink-0 border-b border-slate-100 bg-white">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-4">
                <WorkerSearchBar value={search} onChange={setSearch} />
                
                {/* Select all toggle (Optional feature placeholder) */}
                <div className="text-sm text-slate-500 whitespace-nowrap">
                  Mostrando <span className="font-medium text-slate-900">{filteredWorkers.length}</span> trabajadores
                </div>
              </div>
              
              <WorkerFilterTabs activeTab={activeTab} onTabChange={setActiveTab} />
            </div>

            {/* List */}
            <AvailableWorkersList 
              workers={filteredWorkers}
              isLoading={workersQuery.isLoading}
              selectedIds={selectedIds}
              onToggleWorker={toggleWorker}
              existingWorkerIds={existingWorkerIds}
            />

            {/* Summary */}
            <SelectedWorkersSummary 
              selectedWorkers={selectedWorkers}
              onRemove={removeSelectedWorker}
            />
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 p-6 flex flex-col sm:flex-row justify-between items-center bg-white shrink-0 gap-4">
            <div className="w-full sm:w-1/2">
              <Input
                placeholder="Motivo de asignación (Ej. Refuerzo de obra)..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="flex gap-3 w-full sm:w-auto justify-end">
              <Button type="button" variant="secondary" onClick={onClose} disabled={mutation.isPending}>
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={selectedIds.size === 0 || mutation.isPending}
                onClick={handleAssignClick}
              >
                {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                {mutation.isPending ? "Asignando..." : `Asignar ${selectedIds.size} ${selectedIds.size === 1 ? 'trabajador' : 'trabajadores'}`}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmAssignmentDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmAssignment}
        isPending={mutation.isPending}
        conflictCount={selectedWorkers.filter(w => !!w.work_location_id || !!w.project).length}
      />
    </>
  );
}
