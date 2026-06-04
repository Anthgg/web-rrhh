import { Search, X } from "lucide-react";

interface WorkerSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function WorkerSearchBar({ value, onChange }: WorkerSearchBarProps) {
  return (
    <div className="relative flex-1">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="size-5 text-slate-400" />
      </div>
      <input
        type="text"
        className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl bg-white text-sm focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-shadow"
        placeholder="Buscar por nombre, documento o cargo..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
