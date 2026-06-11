import { UsersRound, HardHat, MapPin, CheckCircle2, History, ArrowRight } from "lucide-react";
import type { WorkCrew } from "@/services/work-crews.service";

interface WorkTeamStatsProps {
 crews: WorkCrew[];
}

export function WorkTeamStats({ crews }: WorkTeamStatsProps) {
 const totalCrews = crews.length;
 const activeCrews = crews.filter(c => c.is_active).length;
 const totalWorkers = crews.reduce((acc, curr) => acc + Number(curr.active_workers_count || 0), 0);
 
 // Count unique active locations in a single pass
 const uniqueLocationsSet = new Set<string>();
 crews.forEach(c => {
 if (c.work_location_id) {
 uniqueLocationsSet.add(c.work_location_id);
 }
 });
 const uniqueLocations = uniqueLocationsSet.size;

 // Sum of all temporarily moved workers across all crews
 const temporarilyMovedWorkers = crews.reduce((acc, curr) => acc + Number(curr.temporarily_moved_workers_count || 0), 0); 
 const monthlyMovements = crews.reduce((acc, curr) => acc + Number(curr.total_movements || 0), 0);

 const cards = [
 {
 label: "Cuadrillas",
 value: totalCrews,
 icon: UsersRound,
 color: "text-purple-600",
 bg: "bg-purple-50",
 tooltip: "Total de cuadrillas registradas en el sistema"
 },
 {
 label: "Activas",
 value: activeCrews,
 icon: CheckCircle2,
 color: "text-emerald-600",
 bg: "bg-emerald-50",
 tooltip: "Cuadrillas actualmente operativas"
 },
 {
 label: "Trabajadores",
 value: totalWorkers,
 icon: HardHat,
 color: "text-blue-600",
 bg: "bg-blue-50",
 tooltip: "Total de trabajadores asignados a cuadrillas"
 },
 {
 label: "Movidos Temporal.",
 value: temporarilyMovedWorkers,
 icon: ArrowRight,
 color: "text-amber-600",
 bg: "bg-amber-50",
 tooltip: "Trabajadores movidos temporalmente a otra cuadrilla u obra"
 },
 {
 label: "Obras Activas",
 value: uniqueLocations,
 icon: MapPin,
 color: "text-violet-600",
 bg: "bg-violet-50",
 tooltip: "Obras que actualmente tienen al menos una cuadrilla principal"
 },
 {
 label: "Mov. del Mes",
 value: monthlyMovements,
 icon: History,
 color: "text-muted-foreground",
 bg: "bg-muted",
 tooltip: "Movimientos registrados globalmente"
 }
 ];

 return (
 <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
 {cards.map((card) => {
 const Icon = card.icon;
 return (
 <div 
 key={card.label} 
 className="bg-card rounded-xl border border-border p-4 shadow-sm flex flex-col justify-between group hover:border-slate-300 transition-colors"
 title={card.tooltip}
 >
 <div className="flex items-center justify-between mb-3">
 <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate mr-2">{card.label}</p>
 <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${card.bg} ${card.color}`}>
 <Icon className="size-4" />
 </div>
 </div>
 <h3 className="text-2xl font-bold text-foreground">{card.value}</h3>
 </div>
 );
 })}
 </div>
 );
}
