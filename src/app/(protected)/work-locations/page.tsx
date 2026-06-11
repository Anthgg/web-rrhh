import { WorkLocationsWorkspace } from "@/features/work-locations/work-locations-workspace";

export const metadata = {
 title: "Lugares de Trabajo | Fabryor Admin",
 description: "Gestiona las sedes, obras y ubicaciones donde trabaja el personal.",
};

export default function WorkLocationsPage() {
 return (
 <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
 <WorkLocationsWorkspace />
 </div>
 );
}
