import { Search, X } from "lucide-react";

interface WorkerSearchBarProps {
 value: string;
 onChange: (value: string) => void;
}

export function WorkerSearchBar({ value, onChange }: WorkerSearchBarProps) {
 return (
 <div className="relative flex-1">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
 <Search className="size-5 text-muted-foreground" />
 </div>
 <input
 type="text"
 aria-label="Buscar trabajador"
 className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl bg-card text-sm focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-shadow"
 placeholder="Buscar por nombre, documento o cargo..."
 value={value}
 onChange={(e) => onChange(e.target.value)}
 />
 {value && (
 <button
 type="button"
 aria-label="Limpiar busqueda de trabajadores"
 onClick={() => onChange("")}
 className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-muted-foreground"
 >
 <X className="size-4" />
 </button>
 )}
 </div>
 );
}
