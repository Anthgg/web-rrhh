"use client";

import { Card } from "@/components/ui/card";
import { Briefcase, ShieldAlert } from "lucide-react";
import type { UserProfile } from "@/types";

interface LaborDataCardProps {
 user: UserProfile;
}

export function LaborDataCard({ user }: LaborDataCardProps) {
 const company = user.companyName || user.worker?.company_name || "No registrado";
 const department = user.departmentName || user.department || user.worker?.department_name || "No registrado";
 const area = user.areaName || user.worker?.area_name || "No registrado";
 const position = user.positionName || user.position || user.worker?.position || "No registrado";
 const workerType = user.worker?.worker_type || "No registrado";
 const hireDate = user.worker?.hire_date ? new Date(user.worker.hire_date).toLocaleDateString("es-PE", { timeZone: "UTC" }) : "No registrado";
 const supervisor = user.worker?.supervisor_name || "No registrado";
 const crew = user.crewName || user.worker?.crew_name || "No registrado";
 const laborStatus = user.laborStatus || user.worker?.status || "No registrado";

 const fields = [
 { label: "Empresa", value: company },
 { label: "Área o Departamento", value: department },
 { label: "Sub-Área / Sección", value: area },
 { label: "Cargo / Función", value: position },
 { label: "Tipo de Colaborador", value: workerType },
 { label: "Fecha de Ingreso", value: hireDate },
 { label: "Supervisor a Cargo", value: supervisor },
 { label: "Cuadrilla Asignada", value: crew },
 { label: "Estado Laboral", value: laborStatus === "active" ? "Activo" : laborStatus === "inactive" ? "Inactivo" : laborStatus },
 ];

 return (
 <Card className="p-6 bg-card border border-border rounded-2xl shadow-sm grid gap-5">
 <div className="flex items-center justify-between gap-3 flex-wrap">
 <div className="flex items-center gap-2">
 <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
 <Briefcase className="size-4" />
 </div>
 <div>
 <h2 className="text-lg font-bold text-foreground">Datos Laborales y Contractuales</h2>
 <p className="text-xs text-muted-foreground mt-0.5">Información contractual de la relación laboral con la empresa.</p>
 </div>
 </div>

 <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-muted text-muted-foreground border border-border">
 <ShieldAlert className="size-3" />
 Gestionado por RR.HH.
 </span>
 </div>

 <div className="grid gap-4 md:grid-cols-2">
 {fields.map((f) => (
 <div key={f.label} className="p-3 bg-muted/50 border border-border rounded-xl flex flex-col">
 <span className="text-xs text-muted-foreground uppercase tracking-[0.08em] font-bold">
 {f.label}
 </span>
 <span className="text-sm font-semibold text-foreground mt-1">
 {f.value}
 </span>
 </div>
 ))}
 </div>
 </Card>
 );
}
