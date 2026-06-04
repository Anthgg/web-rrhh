import { X, UsersRound } from "lucide-react";
import { WorkerRecord } from "@/types";

interface SelectedWorkersSummaryProps {
  selectedWorkers: WorkerRecord[];
  onRemove: (workerId: string) => void;
}

export function SelectedWorkersSummary({ selectedWorkers, onRemove }: SelectedWorkersSummaryProps) {
  if (selectedWorkers.length === 0) return null;

  return (
    <div className="bg-slate-50 border-t border-slate-200 p-4 shrink-0">
      <div className="flex items-center gap-2 mb-3">
        <UsersRound className="size-4 text-indigo-600" />
        <span className="text-sm font-semibold text-slate-900">
          {selectedWorkers.length} {selectedWorkers.length === 1 ? "trabajador seleccionado" : "trabajadores seleccionados"}
        </span>
      </div>
      <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-2">
        {selectedWorkers.map(w => (
          <div key={w.id} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm group transition-colors hover:border-rose-200">
            <span className="text-xs font-medium text-slate-700 max-w-[120px] truncate">{w.fullName}</span>
            <button
              onClick={() => onRemove(w.id)}
              className="text-slate-400 hover:text-rose-500 p-0.5 rounded-full hover:bg-rose-50"
              title="Quitar"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
