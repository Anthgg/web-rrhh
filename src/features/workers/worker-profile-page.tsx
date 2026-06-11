"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BriefcaseBusiness, Mail, Phone, UserRound } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { ErrorState, LoadingPanel } from "@/components/shared/states";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatRole } from "@/lib/utils/format";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { workersService } from "@/services/workers.service";
import { WorkerContractsTable } from "@/features/workers/worker-contracts-table";
import { LaborAssignmentForm } from "@/features/workers/labor-assignment-form";
import { useDownloadWorkerLocationHistoryPdf } from "@/hooks/useDownloadWorkerLocationHistoryPdf";
import { isUuid } from "@/lib/api/worker-ids";

interface WorkerProfilePageProps {
 workerId: string;
}

type WorkerProfileTab = "summary" | "contracts" | "labor-assignment";

const profileTabs: Array<{ key: WorkerProfileTab; label: string }> = [
 { key: "summary", label: "Resumen" },
 { key: "contracts", label: "Contratos" },
 { key: "labor-assignment", label: "Asignación Laboral" },
];

export function WorkerProfilePage({ workerId }: WorkerProfilePageProps) {
 const [activeTab, setActiveTab] = useState<WorkerProfileTab>("summary");
 const downloadHistoryPdf = useDownloadWorkerLocationHistoryPdf();

 const isValidId = isUuid(workerId);

 const {
 data: worker,
 error: workerError,
 isError: isWorkerError,
 isLoading: isWorkerLoading,
 refetch: refetchWorker,
 } = useQuery({
 queryKey: ["worker-detail", workerId],
 queryFn: () => workersService.detail(workerId),
 enabled: isValidId,
 });

 const { data: activeLocation, isLoading: isLoadingActive } = useQuery({
 queryKey: ["workers", workerId, "location-assignment", "active"],
 queryFn: () => workersService.getWorkerActiveLocation(workerId),
 enabled: isValidId,
 });

 if (!isValidId) {
 return (
 <ErrorState
 title="ID de trabajador no válido"
 description="El perfil del trabajador está incompleto o el identificador proporcionado no es un UUID válido."
 />
 );
 }

 if (isWorkerLoading) {
 return <LoadingPanel title="Cargando perfil del trabajador." />;
 }

 if (isWorkerError || !worker) {
 return (
 <ErrorState
 title="No pudimos cargar el perfil"
 description={
 workerError instanceof Error
 ? workerError.message
 : "El trabajador existe, pero no se pudo recuperar su detalle."
 }
 onRetry={() => void refetchWorker()}
 />
 );
 }

 return (
 <>
 <PageHeader
 eyebrow="Perfil de trabajador"
 title={worker.fullName}
 description="Consulta la ficha laboral, datos de contacto e historial contractual del colaborador."
 action={
 <div className="flex items-center gap-2">
 <Button
 type="button"
 variant="secondary"
 disabled={downloadHistoryPdf.isPending || !isUuid(workerId)}
 onClick={() => downloadHistoryPdf.mutate({ workerId })}
 className="h-10 gap-2 rounded-xl px-4"
 >
 {downloadHistoryPdf.isPending ? "Generando PDF..." : "Historial PDF"}
 </Button>
 <Link href="/trabajadores">
 <Button variant="secondary" className="h-10 gap-2 rounded-xl px-4">
 <ArrowLeft className="size-4" />
 Volver
 </Button>
 </Link>
 </div>
 }
 />

 <Card className="grid gap-5">
 <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
 <div className="flex items-start gap-4">
 <UserAvatar
 src={worker.avatarUrl}
 fullName={worker.fullName}
 email={worker.email}
 size="lg"
 rounded="2xl"
 />
 <div className="grid gap-2">
 <div className="flex flex-wrap items-center gap-2">
 <h2 className="section-title text-2xl font-semibold text-foreground">{worker.fullName}</h2>
 <StatusBadge status={worker.status} />
 {(() => {
 const rawLoc = activeLocation as any;
 const loc = rawLoc?.data ?? rawLoc;
 const source = loc?.source;
 if (source === "temporary_assignment" || source === "individual_temporary_location_assignment") {
 return (
 <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-100 text-indigo-700">
 Movido Temporal
 </span>
 );
 }
 return null;
 })()}
 </div>
 <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-foreground-soft">
 <span className="inline-flex items-center gap-1.5">
 <BriefcaseBusiness className="size-4" />
 {worker.position || formatRole(worker.role)}
 </span>
 {worker.email ? (
 <span className="inline-flex items-center gap-1.5">
 <Mail className="size-4" />
 {worker.email}
 </span>
 ) : null}
 {worker.phone ? (
 <span className="inline-flex items-center gap-1.5">
 <Phone className="size-4" />
 {worker.phone}
 </span>
 ) : null}
 </div>
 </div>
 </div>
 </div>

 <div className="flex flex-wrap gap-2 border-b border-border/70">
 {profileTabs.map((tab) => (
 <button
 key={tab.key}
 type="button"
 onClick={() => setActiveTab(tab.key)}
 className={
 activeTab === tab.key
 ? "border-b-2 border-indigo-600 px-3 pb-3 text-sm font-semibold text-indigo-700"
 : "px-3 pb-3 text-sm font-medium text-foreground-soft hover:text-foreground"
 }
 >
 {tab.label}
 </button>
 ))}
 </div>

 {activeTab === "summary" && (
 <div className="space-y-6">
 <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
 <ProfileField label="Rol" value={formatRole(worker.role)} />
 <ProfileField label="Puesto" value={worker.position || "No registrado"} />
 <ProfileField label="Área" value={worker.department || "Sin área"} />
 <ProfileField label="Proyecto" value={worker.project || "Sin proyecto"} />
 <ProfileField label="Correo" value={worker.email || "No registrado"} />
 <ProfileField label="Teléfono" value={worker.phone || "No registrado"} />
 <ProfileField label="DNI" value={worker.documentNumber || "No registrado"} />
 <ProfileField label="Nacimiento" value={worker.birthDate || "No registrado"} />
 <ProfileField label="Estado" value={worker.status} />
 {(() => {
 const rawLoc = activeLocation as any;
 const loc = rawLoc?.data ?? rawLoc;
 const source = loc?.source;
 const isTemp = source === "temporary_assignment" || source === "individual_temporary_location_assignment";
 const activeWorkLocName = loc?.work_location?.name || worker.work_location_name;
 
 if (activeWorkLocName) {
 return (
 <ProfileField
 label="Lugar de Trabajo"
 value={isTemp ? `${activeWorkLocName} (Temporal)` : activeWorkLocName}
 />
 );
 }
 return null;
 })()}
 </section>

 {isLoadingActive && (
 <div className="text-sm text-muted-foreground py-4">Cargando datos de asignación activa...</div>
 )}

 {activeLocation && (
 <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
 <h3 className="text-base font-bold text-foreground mb-4">Ubicación y Asignación Activa</h3>
 
 {(() => {
 const rawLoc = activeLocation as any;
 const loc = rawLoc?.data ?? rawLoc;
 const source = loc?.source;
 const workLocName = loc?.work_location?.name || "Sin obra";

 if (source === "temporary_assignment" || source === "individual_temporary_location_assignment") {
 const endDateStr = loc?.assignment?.end_date 
 ? new Date(loc.assignment.end_date).toLocaleDateString("es-PE", { timeZone: "UTC" }) 
 : "No definida";
 const reasonStr = loc?.assignment?.reason || "No especificado";
 
 return (
 <div className="grid gap-4 sm:grid-cols-2">
 <ProfileField label="Ubicación actual" value={workLocName} />
 <ProfileField label="Estado" value="Movido temporalmente" />
 <ProfileField label="Fecha fin" value={endDateStr} />
 <ProfileField label="Motivo" value={reasonStr} />
 </div>
 );
 }

 if (source === "crew_location") {
 return (
 <div className="grid gap-4 sm:grid-cols-1">
 <ProfileField 
 label="Ubicación actual" 
 value={loc?.work_location?.name ? `${loc.work_location.name} (Obra base de la cuadrilla)` : "Obra base de la cuadrilla"} 
 />
 </div>
 );
 }

 // Default/fallback
 return (
 <div className="grid gap-4 sm:grid-cols-2">
 <ProfileField label="Ubicación actual" value={workLocName} />
 <ProfileField label="Tipo de Asignación" value={source === "direct_worker_location" || source === "individual_permanent_location_assignment" ? "Asignación Permanente Directa" : (source || "Heredada")} />
 </div>
 );
 })()}
 </div>
 )}
 </div>
 )}
 
 {activeTab === "contracts" && (
 <WorkerContractsTable workerId={workerId} />
 )}

 {activeTab === "labor-assignment" && (
 <LaborAssignmentForm workerId={workerId} />
 )}
 </Card>
 </>
 );
}

function ProfileField({ label, value }: { label: string; value: string }) {
 return (
 <div className="rounded-2xl border border-border bg-card px-4 py-3">
 <p className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground-soft">{label}</p>
 <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
 </div>
 );
}
