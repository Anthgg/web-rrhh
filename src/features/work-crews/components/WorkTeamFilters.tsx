import * as React from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Input, Select } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";

import { AdvancedFiltersPopover, type AdvancedFiltersState } from "./AdvancedFiltersPopover";

interface WorkTeamFiltersProps {
 searchQuery: string;
 setSearchQuery: (val: string) => void;
 statusFilter: string;
 setStatusFilter: (val: string) => void;
 assignmentFilter: string;
 setAssignmentFilter: (val: string) => void;
 advancedFilters: AdvancedFiltersState;
 setAdvancedFilters: (filters: AdvancedFiltersState) => void;
}

export function WorkTeamFilters({ 
 searchQuery, 
 setSearchQuery,
 statusFilter,
 setStatusFilter,
 assignmentFilter,
 setAssignmentFilter,
 advancedFilters,
 setAdvancedFilters
}: WorkTeamFiltersProps) {
 const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false);

 const hasAdvancedFilters = 
 advancedFilters.supervisor !== "" || 
 advancedFilters.workLocation !== "" || 
 advancedFilters.movedWorkersOnly;

 return (
 <div className="flex flex-col xl:flex-row items-center gap-3 mb-6 bg-card p-3 rounded-2xl border border-border shadow-sm">
 <div className="relative flex-1 w-full">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
 <Input
 placeholder="Buscar por cuadrilla, supervisor, trabajador u obra..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="pl-9 bg-muted border-transparent focus-visible:bg-card w-full rounded-xl"
 />
 {searchQuery && (
 <button 
 onClick={() => setSearchQuery("")}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
 >
 <X className="size-4" />
 </button>
 )}
 </div>

 <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full xl:w-auto">
 <div className="w-full sm:w-[180px] shrink-0">
 <Select 
 value={statusFilter} 
 onChange={(e) => setStatusFilter(e.target.value)}
 className="rounded-xl bg-muted border-transparent hover:border-slate-300"
 >
 <option value="all">Todas las cuadrillas</option>
 <option value="active">Solo activas</option>
 <option value="inactive">Solo inactivas</option>
 </Select>
 </div>

 <div className="w-full sm:w-[220px] shrink-0">
 <Select 
 value={assignmentFilter} 
 onChange={(e) => setAssignmentFilter(e.target.value)}
 className="rounded-xl bg-muted border-transparent hover:border-slate-300"
 >
 <option value="all">Tipos de Asignación</option>
 <option value="main">En Obra Principal</option>
 <option value="temp">Movidos temporalmente</option>
 <option value="permanent">Movimiento permanente</option>
 <option value="expired">Asignación vencida</option>
 <option value="returned">Retornados</option>
 <option value="none">Sin obra actual</option>
 </Select>
 </div>

 <div className="relative w-full sm:w-auto">
 <Button 
 variant={hasAdvancedFilters ? "primary" : "secondary"}
 onClick={() => setIsAdvancedOpen(true)}
 className={`w-full sm:w-auto gap-2 rounded-xl ${hasAdvancedFilters ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300' : 'border-border text-foreground bg-card hover:bg-muted'}`}
 >
 <SlidersHorizontal className={`size-4 ${hasAdvancedFilters ? 'text-indigo-600' : 'text-muted-foreground'}`} />
 {hasAdvancedFilters ? "Filtros aplicados" : "Más filtros"}
 </Button>

 <AdvancedFiltersPopover 
 isOpen={isAdvancedOpen} 
 onClose={() => setIsAdvancedOpen(false)}
 filters={advancedFilters}
 setFilters={setAdvancedFilters}
 />
 </div>
 </div>
 </div>
 );
}
