import { UsersRound, Building2, BarChart3 } from "lucide-react";

interface WorkTeamsTabsProps {
 viewMode: "crews" | "locations" | "reports";
 setViewMode: (mode: "crews" | "locations" | "reports") => void;
 crewsCount?: number;
}

export function WorkTeamsTabs({ viewMode, setViewMode, crewsCount }: WorkTeamsTabsProps) {
 return (
 <div className="mb-6 flex flex-wrap items-center gap-1 bg-muted p-1.5 rounded-xl w-fit border border-border">
 <button 
 onClick={() => setViewMode("crews")} 
 className={`flex items-center gap-2 py-2 px-4 text-sm font-medium rounded-lg transition-all ${
 viewMode === "crews" 
 ? "bg-card text-indigo-700 shadow-sm border border-border/50" 
 : "text-muted-foreground hover:text-foreground hover:bg-slate-200/50 border border-transparent"
 }`}
 >
 <UsersRound className="size-4" />
 Vista por Cuadrillas
 {crewsCount !== undefined && (
 <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs ${viewMode === "crews" ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-muted-foreground"}`}>
 {crewsCount}
 </span>
 )}
 </button>

 <button 
 onClick={() => setViewMode("locations")} 
 className={`flex items-center gap-2 py-2 px-4 text-sm font-medium rounded-lg transition-all ${
 viewMode === "locations" 
 ? "bg-card text-violet-700 shadow-sm border border-border/50" 
 : "text-muted-foreground hover:text-foreground hover:bg-slate-200/50 border border-transparent"
 }`}
 >
 <Building2 className="size-4" />
 Vista por Obras
 </button>

 <button 
 onClick={() => setViewMode("reports")} 
 className={`flex items-center gap-2 py-2 px-4 text-sm font-medium rounded-lg transition-all ${
 viewMode === "reports" 
 ? "bg-card text-emerald-700 shadow-sm border border-border/50" 
 : "text-muted-foreground hover:text-foreground hover:bg-slate-200/50 border border-transparent"
 }`}
 >
 <BarChart3 className="size-4" />
 Reportes
 </button>
 </div>
 );
}
