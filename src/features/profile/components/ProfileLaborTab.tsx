"use client";

import { Briefcase, ShieldAlert, Calendar, User, MapPin, Layers, Clock, DollarSign, Award, Tag, Building } from "lucide-react";
import type { UserProfile } from "@/types";
import { ProfileSectionCard } from "./ProfileSectionCard";
import { ProfileField } from "./ProfileField";

interface ProfileLaborTabProps {
 user: UserProfile;
}

/** Resolve crew display following the approved crew logic rules */
function resolveCrewDisplay(
 workLocationName: string | null | undefined,
 crewName: string | null | undefined,
): string | null {
 const hasLocation = !!workLocationName;
 const hasCrew = crewName !== null && crewName !== undefined && crewName !== "";

 if (hasCrew) return crewName; // Backend sent crewName → always show it
 if (hasLocation && !hasCrew) return "Sin cuadrilla"; // Has obra but no crew
 return null; // No obra, no crew → "No registrado" via ProfileField fallback
}

export function ProfileLaborTab({ user }: ProfileLaborTabProps) {
 const hasWorker = user.hasWorkerRecord;

 // Company / org data
 const company = user.companyName || user.worker?.company_name || null;
 const department = user.departmentName || user.department || user.worker?.department_name || null;
 const area = user.areaName || user.worker?.area_name || null;
 const position = user.positionName || user.position || user.worker?.position || null;

 // Worker-specific fields — read from worker node with camelCase + snake_case aliases
 const workerType = user.worker?.worker_type || null;
 const branchName = user.worker?.branch_name || null;
 const supervisor = user.worker?.supervisor_name || null;
 const project = user.workLocationName || user.project || user.worker?.work_location_name || null;

 // Crew with approved logic
 const crew = resolveCrewDisplay(
 user.workLocationName || user.worker?.work_location_name,
 user.crewName ?? user.worker?.crew_name,
 );

 // Shift / schedule
 const shift = user.shiftName || null;
 const modality = user.modality || null;

 // Cost center
 const costCenter = user.costCenter || null;

 // Hire date — format for display
 const hireDate = user.worker?.hire_date
 ? new Date(user.worker.hire_date).toLocaleDateString("es-PE", { timeZone: "UTC" })
 : null;

 // Labor status — translate known values
 const rawLaborStatus = user.laborStatus || user.worker?.status || null;
 const laborStatus =
 rawLaborStatus === "active"
 ? "Activo"
 : rawLaborStatus === "inactive"
 ? "Inactivo"
 : rawLaborStatus; // show as-is if other value, or null → "No registrado"

 return (
 <ProfileSectionCard
 title="Datos Laborales y Contractuales"
 description="Información contractual de la relación laboral con la empresa."
 icon={<Briefcase className="size-5" />}
 badge={
 <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-muted text-muted-foreground border border-border">
 <ShieldAlert className="size-3" />
 Gestionado por RR.HH.
 </span>
 }
 >
 {hasWorker ? (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 <ProfileField label="Empresa" value={company} icon={<Layers className="size-4" />} />
 <ProfileField label="Departamento interno" value={department} icon={<Layers className="size-4" />} />
 <ProfileField label="Área / Sección" value={area} icon={<Layers className="size-4" />} />
 <ProfileField label="Cargo / Función" value={position} icon={<Award className="size-4" />} />
 <ProfileField label="Tipo de Colaborador" value={workerType} icon={<User className="size-4" />} />
 <ProfileField label="Fecha de Ingreso" value={hireDate} icon={<Calendar className="size-4" />} />
 <ProfileField label="Estado laboral" value={laborStatus} icon={<Tag className="size-4" />} />
 <ProfileField label="Sede / Branch" value={branchName} icon={<Building className="size-4" />} />
 <ProfileField label="Obra o Proyecto actual" value={project} icon={<MapPin className="size-4" />} />
 <ProfileField label="Cuadrilla actual" value={crew} icon={<Layers className="size-4" />} />
 <ProfileField label="Supervisor responsable" value={supervisor} icon={<User className="size-4" />} />
 <ProfileField label="Turno / Jornada" value={shift} icon={<Clock className="size-4" />} />
 <ProfileField label="Modalidad" value={modality} icon={<User className="size-4" />} />
 <ProfileField label="Centro de costo" value={costCenter} icon={<DollarSign className="size-4" />} />
 </div>
 ) : (
 <div className="p-8 bg-muted border border-border rounded-2xl text-center text-xs sm:text-sm text-muted-foreground italic">
 No se encontró ficha laboral asociada.
 </div>
 )}
 </ProfileSectionCard>
 );
}
