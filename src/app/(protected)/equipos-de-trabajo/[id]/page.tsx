import { WorkCrewDetailView } from "@/features/work-crews/work-crew-detail-view";

export const metadata = {
 title: "Detalle de Cuadrilla - FABRYOR",
 description: "Detalle de equipo de trabajo y trabajadores asignados",
};

interface PageProps {
 params: Promise<{
 id: string;
 }>;
}

export default async function WorkCrewDetailPage({ params }: PageProps) {
 const { id } = await params;
 return (
 <div className="h-[calc(100vh-var(--header-height))] w-full">
 <WorkCrewDetailView crewId={id} />
 </div>
 );
}
