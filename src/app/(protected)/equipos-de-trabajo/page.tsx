import { WorkCrewsWorkspace } from "@/features/work-crews/work-crews-workspace";
import { Metadata } from "next";

export const metadata: Metadata = {
 title: "Equipos de Trabajo",
 description: "Administra las cuadrillas y equipos de trabajo",
};

export default function EquiposDeTrabajoPage() {
 return <WorkCrewsWorkspace />;
}
