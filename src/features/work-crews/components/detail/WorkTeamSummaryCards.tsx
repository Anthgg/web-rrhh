import { Users, UserCheck, UserMinus, Clock, Activity, CalendarSync } from "lucide-react";

interface WorkTeamSummaryCardsProps {
 totalWorkers: number;
 inMainLocation: number;
 tempMoved: number;
 totalMovements: number; // can be "N/A" if not supported yet
 lastUpdated: string;
}

export function WorkTeamSummaryCards({ 
 totalWorkers, 
 inMainLocation, 
 tempMoved, 
 totalMovements,
 lastUpdated
}: WorkTeamSummaryCardsProps) {
 
 const cards = [
 { label: "Total Trabajadores", value: totalWorkers, icon: Users, color: "text-muted-foreground", bg: "bg-muted", border: "border-border" },
 { label: "En Obra Principal", value: inMainLocation, icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
 { label: "Movidos Temporal", value: tempMoved, icon: UserMinus, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" },
 { label: "Movimientos Registrados", value: totalMovements ?? 0, icon: Activity, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
 { label: "Última Actualización", value: lastUpdated, icon: CalendarSync, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
 ];

 return (
 <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 p-6 bg-muted border-b border-border shrink-0">
 {cards.map((card) => {
 const Icon = card.icon;
 return (
 <div key={card.label} className={`flex flex-col p-4 rounded-2xl bg-card border ${card.border} shadow-sm relative overflow-hidden group`}>
 <div className={`absolute -right-4 -top-4 size-16 rounded-full opacity-20 transition-transform group-hover:scale-150 ${card.bg}`} />
 <div className="flex items-center gap-3 mb-3 relative z-10">
 <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${card.bg} ${card.color}`}>
 <Icon className="size-4" />
 </div>
 <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide leading-tight">{card.label}</h3>
 </div>
 <div className="text-2xl font-bold text-foreground relative z-10">{card.value}</div>
 </div>
 );
 })}
 </div>
 );
}
