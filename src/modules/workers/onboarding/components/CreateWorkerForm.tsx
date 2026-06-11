"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
 AlertCircle,
 AlertTriangle,
 ArrowLeft,
 ArrowRight,
 CheckCircle2,
 FileSignature,
 Loader2,
 Save,
 UserCheck,
 UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkerOnboarding } from "../hooks/useWorkerOnboarding";
import { WorkerReassignModal } from "@/features/work-crews/components/WorkerReassignModal";
import { canReassignWorker } from "@/lib/api/error-handlers";
import { AccessDataForm } from "./AccessDataForm";
import { ContractDataForm } from "./ContractDataForm";
import { LaborDataForm } from "./LaborDataForm";
import { OnboardingStatusChecklist } from "./OnboardingStatusChecklist";
import { OnboardingSummary } from "./OnboardingSummary";
import { PersonalDataForm } from "./PersonalDataForm";
import { SignedContractUpload } from "./SignedContractUpload";
import { OnboardingSummaryPanel } from "./OnboardingSummaryPanel";
import { OnboardingHeader } from "./OnboardingHeader";
import { OnboardingStepper } from "./OnboardingStepper";

const steps = [
 { id: 1, label: "Datos personales", fieldPrefix: "personalData." },
 { id: 2, label: "Datos laborales", fieldPrefix: "laborData." },
 { id: 3, label: "Sueldo y condiciones", fieldPrefix: "contractData." },
 { id: 4, label: "Acceso al sistema", fieldPrefix: "accessData." },
 { id: 5, label: "Confirmación final", fieldPrefix: "" },
];

function CreateWorkerFormContent() {
 const searchParams = useSearchParams();
 const {
 step,
 setStep,
 nextStep,
 prevStep,
 form,
 onSubmit,
 isSubmitting,
 globalError,
 setGlobalError,
 registrationResult,
 completionMode,
 contractMode,
 completionSaved,
 completionWarnings,
 isLoadingPrefill,
 missingFields,
 catalogs,
 assignmentConflict,
 setAssignmentConflict,
 isReassignOpen,
 setIsReassignOpen,
 profileQuery,
 } = useWorkerOnboarding();

 const contractId = registrationResult?.contract_id;
 const workerId = registrationResult?.worker_id;

 const visibleSteps = completionMode
 ? steps.filter((item) => [1, 2, 5].includes(item.id))
 : contractMode
 ? steps.filter((item) => [3, 4, 5].includes(item.id))
 : steps;

 // Resolve Header Metadata
 const workerIdFromUrl = searchParams.get("workerId");
 const hasWorkerId = Boolean(workerIdFromUrl || workerId);
 const isProfileComplete = completionMode && missingFields.length === 0;

 return (
 <div className="space-y-6">
 {/* ─── 1. HEADER DEL MÓDULO ─── */}
 <OnboardingHeader
 contractMode={contractMode}
 completionMode={completionMode}
 hasWorkerId={hasWorkerId}
 isProfileComplete={isProfileComplete}
 />

 {/* ─── 2. STEPPER HORIZONTAL AMPLIO ─── */}
 <OnboardingStepper
 step={step}
 setStep={setStep}
 visibleSteps={visibleSteps}
 missingFields={missingFields}
 completionMode={completionMode}
 />

 {/* ─── 3. CONTENIDO PRINCIPAL EN GRID DE DOS COLUMNAS ─── */}
 <form onSubmit={onSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_380px] items-start">
 {/* Columna Izquierda: Formulario y Pasos */}
 <div className="min-w-0 space-y-6">
 {isLoadingPrefill ? (
 <div className="flex items-center gap-2.5 rounded-2xl border border-indigo-50 bg-indigo-50/20 px-5 py-4 text-xs font-semibold text-indigo-700 animate-pulse">
 <Loader2 className="size-4 animate-spin" />
 Cargando datos del colaborador...
 </div>
 ) : null}

 {contractMode && !isLoadingPrefill ? (
 <div className="flex items-start gap-2.5 rounded-2xl border border-indigo-100 bg-indigo-50/20 px-5 py-4 text-xs font-medium text-indigo-800">
 <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-indigo-600" />
 <span>
 Los datos personales y laborales del trabajador fueron cargados automáticamente.
 Completa las condiciones salariales y el tipo de contrato para continuar.
 </span>
 </div>
 ) : null}

 {completionMode && !isLoadingPrefill && missingFields.length > 0 ? (
 <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/25 px-5 py-4 text-xs font-medium text-amber-800">
 <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
 <span>Completa los campos obligatorios pendientes marcados antes de guardar la ficha.</span>
 </div>
 ) : null}

 {catalogs.isLoading && step !== 1 ? (
 <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-muted/50 px-5 py-4 text-xs font-semibold text-muted-foreground">
 <Loader2 className="size-4 animate-spin text-muted-foreground" />
 Cargando catálogos actualizados...
 </div>
 ) : null}

 {/* Renderizar Formularios */}
 {step === 1 ? <PersonalDataForm form={form} /> : null}
 {step === 2 ? <LaborDataForm form={form} catalogs={catalogs} preservePositionOnAreaChange={completionMode} /> : null}
 {step === 3 ? <ContractDataForm form={form} catalogs={catalogs} /> : null}
 {step === 4 ? <AccessDataForm form={form} roles={catalogs.roles} /> : null}
 {step === 5 ? <OnboardingSummary form={form} catalogs={catalogs} completionMode={completionMode} /> : null}

 {completionSaved ? (
 <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/25 px-5 py-4 text-xs font-semibold text-emerald-800">
 <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
 <span>Perfil laboral completado correctamente.</span>
 </div>
 ) : null}

 {completionWarnings.length ? (
 <div className="grid gap-2 rounded-2xl border border-amber-200 bg-amber-50/25 px-5 py-4 text-xs text-amber-950 font-medium">
 {completionWarnings.map((warning) => (
 <div key={`${warning.field || "warning"}-${warning.message}`} className="flex items-start gap-2">
 <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
 <span>{warning.message}</span>
 </div>
 ))}
 </div>
 ) : null}

 {/* Pasos finales: Carga de contrato y checklist */}
 {step === 6 && workerId ? (
 <div className="grid gap-6">
 {contractId ? (
 <SignedContractUpload
 workerId={workerId}
 contractId={contractId}
 contractPdfUrl={registrationResult.contract_pdf_url}
 onUploadSuccess={() => setStep(7)}
 />
 ) : null}
 <OnboardingStatusChecklist workerId={workerId} />
 </div>
 ) : null}

 {step === 7 && workerId ? <OnboardingStatusChecklist workerId={workerId} /> : null}

 {globalError ? (
 <div className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-xs font-semibold text-rose-800 animate-fadeIn">
 <div className="flex items-start gap-2.5">
 <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-500" />
 <span>{globalError}</span>
 </div>
 {assignmentConflict && (
 <div className="mt-2 border-t border-rose-200/50 pt-2 flex flex-col gap-2">
 <p className="text-[11px] text-rose-700/80 font-normal">
 El trabajador ya se encuentra asignado a otra obra o cuadrilla. Puedes solicitar una reasignación formal.
 </p>
 {canReassignWorker(profileQuery.data) ? (
 <Button
 type="button"
 onClick={() => setIsReassignOpen(true)}
 className="w-fit bg-amber-500 hover:bg-amber-600 text-white font-medium shadow-sm h-8 px-3 rounded-lg text-[11px]"
 >
 Reasignar trabajador
 </Button>
 ) : (
 <p className="text-[11px] text-rose-600 font-medium">
 Solo su supervisor actual, RR.HH. o un administrador puede moverlo.
 </p>
 )}
 </div>
 )}
 </div>
 ) : null}

 {isReassignOpen && assignmentConflict && (
 <WorkerReassignModal
 isOpen={isReassignOpen}
 onClose={() => setIsReassignOpen(false)}
 workerId={assignmentConflict.workerId}
 targetWorkLocationId={assignmentConflict.requestedWorkLocationId}
 targetCrewId={assignmentConflict.requestedCrewId}
 onSuccess={() => {
 setAssignmentConflict(null);
 setGlobalError(null);
 }}
 />
 )}

 {/* ─── 4. FLOATING STICKY ACTION FOOTER BAR ─── */}
 {step <= 5 ? (
 <div className="sticky bottom-4 z-20 bg-card/95 backdrop-blur-md border border-border rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-all">
 <div className="flex items-center gap-2 w-full sm:w-auto">
 <Button
 type="button"
 variant="secondary"
 onClick={prevStep}
 disabled={step === 1 || isSubmitting}
 className="gap-1.5 h-10 px-4 rounded-xl text-xs font-semibold flex-1 sm:flex-initial"
 >
 <ArrowLeft className="size-4" />
 Anterior
 </Button>
 <Button
 type="button"
 variant="ghost"
 disabled={isSubmitting}
 className="gap-1.5 h-10 px-4 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground flex-1 sm:flex-initial"
 >
 <Save className="size-4" />
 Guardar borrador
 </Button>
 </div>

 {step < 5 ? (
 <Button
 type="button"
 onClick={() => void nextStep()}
 disabled={isSubmitting || catalogs.isLoading}
 className="gap-1.5 h-10 px-4 rounded-xl text-xs font-semibold w-full sm:w-auto"
 >
 Siguiente
 <ArrowRight className="size-4" />
 </Button>
 ) : (
 <Button type="submit" disabled={isSubmitting} className="gap-1.5 h-10 px-4 rounded-xl text-xs font-semibold w-full sm:w-auto">
 {isSubmitting ? (
 <Loader2 className="size-4 animate-spin" />
 ) : contractMode ? (
 <FileSignature className="size-4" />
 ) : completionMode ? (
 <UserCheck className="size-4" />
 ) : (
 <UserPlus className="size-4" />
 )}
 {isSubmitting
 ? contractMode
 ? "Generando contrato..."
 : completionMode
 ? "Guardando cambios..."
 : "Creando trabajador..."
 : contractMode
 ? "Generar contrato inicial"
 : completionMode
 ? "Guardar cambios"
 : "Crear trabajador"}
 </Button>
 )}
 </div>
 ) : null}
 </div>

 {/* Columna Derecha: Resumen Lateral */}
 {step <= 5 ? (
 <aside className="col-span-1 min-w-0 xl:sticky xl:top-24 xl:self-start">
 <OnboardingSummaryPanel
 form={form}
 completionMode={completionMode}
 contractMode={contractMode}
 catalogs={catalogs}
 missingFields={missingFields}
 />
 </aside>
 ) : null}
 </form>
 </div>
 );
}

export function CreateWorkerForm() {
 return (
 <Suspense
 fallback={
 <div className="flex flex-col items-center justify-center p-8 space-y-3">
 <Loader2 className="size-8 animate-spin text-indigo-600" />
 <span className="text-xs text-muted-foreground font-medium">Inicializando formulario de alta...</span>
 </div>
 }
 >
 <CreateWorkerFormContent />
 </Suspense>
 );
}
