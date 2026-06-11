import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { organizationService, type OrganizationWorkLocation } from "@/services/organization.service";
import { extractArray } from "@/lib/utils/extract-array";
import { LoadingPanel, ErrorState } from "@/components/shared/states";
import { WorkLocationCard } from "./WorkLocationCard";
import { WorkLocationWorkersSummary } from "./WorkLocationWorkersSummary";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WorkersByLocationViewProps {
 searchQuery: string;
 statusFilter: string;
 assignmentFilter: string;
 advancedFilters: any;
 setSearchQuery: (val: string) => void;
}

export function WorkersByLocationView({
 searchQuery,
 statusFilter,
 assignmentFilter,
 advancedFilters,
 setSearchQuery,
}: WorkersByLocationViewProps) {
 const [selectedLocation, setSelectedLocation] = useState<OrganizationWorkLocation | null>(null);

 const {
 data: locations = [],
 isError: isLocationsError,
 isLoading: isLocationsLoading,
 refetch: refetchLocations,
 } = useQuery({
 queryKey: ["work-locations"],
 queryFn: async () => {
 const data = await organizationService.getWorkLocations();
 return extractArray<OrganizationWorkLocation>(data);
 },
 });

 const filteredLocations = useMemo(() => {
 return locations.filter((loc) => {
 // 1. Status Filter
 const isActive = loc.is_active ?? loc.status ?? true;
 if (statusFilter === "active" && !isActive) return false;
 if (statusFilter === "inactive" && isActive) return false;

 // 2. Assignment Filter (Mock mappings based on metrics)
 const metrics = loc.workers_metrics;
 if (assignmentFilter === "main" && (!metrics || metrics.base_crew_workers === 0)) return false;
 if (assignmentFilter === "temp" && (!metrics || metrics.temporary_received === 0)) return false;

 // 3. Search Query Filter
 if (searchQuery) {
 const lowerQ = searchQuery.toLowerCase();
 const matchesName = loc.name?.toLowerCase().includes(lowerQ);
 const matchesAddress = loc.address?.toLowerCase().includes(lowerQ);
 if (!matchesName && !matchesAddress) return false;
 }

 return true;
 });
 }, [locations, statusFilter, assignmentFilter, searchQuery]);

 if (isLocationsLoading) {
 return <div className="p-12"><LoadingPanel title="Cargando obras y métricas..." /></div>;
 }

 if (isLocationsError) {
 return (
 <ErrorState 
 title="Error de conexión" 
 description="No se pudieron cargar las obras." 
 onRetry={() => refetchLocations()} 
 />
 );
 }

 if (locations.length === 0) {
 return (
 <div className="flex flex-col items-center justify-center p-16 bg-card rounded-2xl border border-border shadow-sm text-center">
 <Building2 className="size-16 mb-4 text-slate-200" />
 <h3 className="text-xl font-bold text-foreground mb-2">Aún no hay obras registradas</h3>
 <p className="text-sm text-muted-foreground max-w-sm mb-6">
 Para ver la distribución de trabajadores por obra, primero necesitas registrar tus obras en el módulo de Organización.
 </p>
 <Button onClick={() => {}} className="bg-indigo-600 hover:bg-indigo-700">Crear obra</Button>
 </div>
 );
 }

 if (filteredLocations.length === 0) {
 return (
 <div className="flex flex-col items-center justify-center p-16 bg-card rounded-2xl border border-border shadow-sm text-center">
 <Building2 className="size-16 mb-4 text-slate-200" />
 <h3 className="text-xl font-bold text-foreground mb-2">No se encontraron obras</h3>
 <p className="text-sm text-muted-foreground max-w-sm mb-6">
 Ninguna obra coincide con los filtros aplicados actualmente.
 </p>
 <Button variant="secondary" onClick={() => setSearchQuery("")}>Limpiar filtros</Button>
 </div>
 );
 }

 return (
 <div className="flex flex-col gap-6">
 <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
 {filteredLocations.map((loc) => (
 <WorkLocationCard 
 key={loc.id} 
 location={loc} 
 onViewDetail={() => {
 if (selectedLocation?.id === loc.id) setSelectedLocation(null);
 else setSelectedLocation(loc);
 // scroll to summary
 setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
 }} 
 />
 ))}
 </div>

 {selectedLocation && (
 <WorkLocationWorkersSummary 
 location={selectedLocation} 
 onClose={() => setSelectedLocation(null)} 
 />
 )}
 </div>
 );
}
