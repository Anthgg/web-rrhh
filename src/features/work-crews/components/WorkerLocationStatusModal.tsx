"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, X, Navigation, CalendarClock, History, MapPin, Building2, User } from "lucide-react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { LoadingPanel, ErrorState } from "@/components/shared/states";
import { DataTable } from "@/components/shared/data-table";

import { workersService, WorkerActiveLocation, WorkerAssignmentHistory } from "@/services/workers.service";
import { WorkerIndividualAssignmentModal } from "./WorkerIndividualAssignmentModal";
import { WorkerMovementHistoryTab } from "./WorkerMovementHistoryTab";
import { extractArray } from "@/lib/utils/extract-array";

const LocationPickerMap = dynamic(
 () => import("@/components/maps/LocationPickerMap").then((m) => m.LocationPickerMap),
 { ssr: false }
);

interface WorkerLocationStatusModalProps {
 isOpen: boolean;
 onClose: () => void;
 workerId: string;
}

export function WorkerLocationStatusModal({
 isOpen,
 onClose,
 workerId,
}: WorkerLocationStatusModalProps) {
 const [activeTab, setActiveTab] = useState<"active" | "history">("active");
 const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

 const { data: activeQueryData, isLoading: isLoadingActive, isError: isErrorActive, refetch: refetchActive } = useQuery({
 queryKey: ["worker-location-active", workerId],
 queryFn: () => workersService.getWorkerActiveLocation(workerId),
 enabled: isOpen && activeTab === "active",
 });

 const renderActiveTab = () => {
 if (isLoadingActive) return <LoadingPanel title="Cargando ubicación activa..." />;
 if (isErrorActive) return <ErrorState title="Error" description="No se pudo cargar la ubicación activa" onRetry={() => refetchActive()} />;

 const rawData = activeQueryData as any;
 const data = rawData?.data ?? rawData;
 if (!data || Object.keys(data).length === 0) return <div className="p-6 text-center text-muted-foreground">Sin datos de ubicación</div>;

 const sourceLabel = {
 temporary_assignment: "Asignación Temporal Activa",
 crew_location: "Heredada de Cuadrilla",
 direct_worker_location: "Asignación Directa Permanente",
 individual_temporary_location_assignment: "Asignación Temporal Activa",
 individual_permanent_location_assignment: "Asignación Directa Permanente",
 }[data.source as string] || (data.source as string)?.replace(/_/g, " ");

 const sourceIcon = {
 temporary_assignment: <CalendarClock className="size-5 text-indigo-600" />,
 crew_location: <UsersRound className="size-5 text-indigo-600" />,
 direct_worker_location: <User className="size-5 text-indigo-600" />,
 individual_temporary_location_assignment: <CalendarClock className="size-5 text-indigo-600" />,
 individual_permanent_location_assignment: <User className="size-5 text-indigo-600" />,
 }[data.source as string];

 return (
 <div className="space-y-6">
 <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 flex gap-4">
 <div className="mt-0.5">{sourceIcon}</div>
 <div>
 <h3 className="font-semibold text-indigo-900">{sourceLabel}</h3>
 {data.source === "temporary_assignment" && data.assignment && (
 <p className="text-sm text-indigo-700 mt-1">
 Desde: {new Date(data.assignment.start_date).toLocaleDateString()} | Hasta: {data.assignment.end_date ? new Date(data.assignment.end_date).toLocaleDateString() : "N/A"}
 <br />Motivo: {data.assignment.reason || "Sin motivo registrado"}
 </p>
 )}
 {data.source === "crew_location" && data.crew && (
 <p className="text-sm text-indigo-700 mt-1">
 Cuadrilla: <strong>{data.crew.name}</strong>
 </p>
 )}
 </div>
 </div>

 {data.work_location ? (
 <div className="rounded-xl border border-border overflow-hidden">
 <div className="p-4 bg-card border-b border-border">
 <h4 className="font-semibold text-foreground">{data.work_location.name}</h4>
 <p className="text-sm text-muted-foreground">{data.work_location.address}</p>
 </div>
 <div className="h-64 bg-muted relative isolate">
 <LocationPickerMap
 latitude={data.work_location.latitude}
 longitude={data.work_location.longitude}
 radius={data.work_location.allowed_radius_meters}
 onLocationChange={() => {}}
 disabled={true}
 />
 <div className="absolute bottom-2 left-2 right-2 bg-card/90 backdrop-blur-sm p-2 rounded-lg text-xs flex justify-between shadow-sm z-[1000] border border-border">
 <span className="text-muted-foreground font-medium">Ubicación válida para asistencia</span>
 <span className="text-muted-foreground font-mono flex items-center gap-1">
 <Navigation className="size-3" />
 {data.work_location.latitude.toFixed(4)}, {data.work_location.longitude.toFixed(4)}
 </span>
 </div>
 </div>
 </div>
 ) : (
 <div className="text-center p-6 border border-dashed border-slate-300 rounded-xl text-muted-foreground">
 El trabajador no tiene una obra asignada actualmente.
 </div>
 )}

 <div className="flex justify-end gap-2">
 <Button variant="secondary" onClick={() => setIsAssignModalOpen(true)}>
 Crear Asignación Temporal / Permanente
 </Button>
 </div>
 </div>
 );
 };

 if (!isOpen) return null;

 return (
 <>
 <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/60 p-4">
 <div className="flex w-full max-w-3xl max-h-[85vh] flex-col rounded-2xl bg-card shadow-2xl overflow-hidden">
 {/* Header */}
 <div className="flex items-center justify-between border-b border-border px-6 py-5 shrink-0">
 <div className="flex items-center gap-3">
 <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
 <MapPin className="size-5" />
 </div>
 <div>
 <h2 className="text-lg font-bold text-foreground">Ubicación y Asignaciones</h2>
 <p className="text-xs text-muted-foreground">Consulta la obra activa o el historial del trabajador.</p>
 </div>
 </div>
 <button
 type="button"
 onClick={onClose}
 className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-muted-foreground"
 >
 <X className="size-5" />
 </button>
 </div>

 {/* Tabs */}
 <div className="flex items-center gap-4 px-6 pt-4 border-b border-border shrink-0">
 <button
 type="button"
 className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
 activeTab === "active" ? "border-indigo-600 text-indigo-700" : "border-transparent text-muted-foreground hover:text-foreground"
 }`}
 onClick={() => setActiveTab("active")}
 >
 <span className="flex items-center gap-2"><MapPin className="size-4" /> Ubicación Activa</span>
 </button>
 <button
 type="button"
 className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
 activeTab === "history" ? "border-indigo-600 text-indigo-700" : "border-transparent text-muted-foreground hover:text-foreground"
 }`}
 onClick={() => setActiveTab("history")}
 >
 <span className="flex items-center gap-2"><History className="size-4" /> Historial</span>
 </button>
 </div>

 {/* Body */}
 <div className="flex-1 overflow-y-auto p-6">
 {activeTab === "active" ? renderActiveTab() : <WorkerMovementHistoryTab workerId={workerId} />}
 </div>
 </div>
 </div>

 {isAssignModalOpen && (
 <WorkerIndividualAssignmentModal
 isOpen={isAssignModalOpen}
 onClose={() => setIsAssignModalOpen(false)}
 workerId={workerId}
 crewId={(activeQueryData as any)?.data?.crew?.id ?? (activeQueryData as any)?.crew?.id}
 />
 )}
 </>
 );
}

// Needed for an icon reference
import { UsersRound } from "lucide-react";
