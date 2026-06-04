"use client";

import { AlertCircle, AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Loader2, Save, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWorkerOnboarding } from "../hooks/useWorkerOnboarding";
import { AccessDataForm } from "./AccessDataForm";
import { ContractDataForm } from "./ContractDataForm";
import { LaborDataForm } from "./LaborDataForm";
import { OnboardingStatusChecklist } from "./OnboardingStatusChecklist";
import { OnboardingSummary } from "./OnboardingSummary";
import { PersonalDataForm } from "./PersonalDataForm";
import { SignedContractUpload } from "./SignedContractUpload";

const steps = [
  { id: 1, label: "Datos personales", fieldPrefix: "personalData." },
  { id: 2, label: "Datos laborales", fieldPrefix: "laborData." },
  { id: 3, label: "Sueldo y condiciones", fieldPrefix: "contractData." },
  { id: 4, label: "Acceso al sistema", fieldPrefix: "accessData." },
  { id: 5, label: "Confirmacion final", fieldPrefix: "" },
];

export function CreateWorkerForm() {
  const {
    step,
    setStep,
    nextStep,
    prevStep,
    form,
    onSubmit,
    isSubmitting,
    globalError,
    registrationResult,
    completionMode,
    completionSaved,
    completionWarnings,
    isLoadingPrefill,
    missingFields,
    catalogs,
  } = useWorkerOnboarding();

  const contractId = registrationResult?.contract_id;
  const workerId = registrationResult?.worker_id;
  const visibleSteps = completionMode ? steps.filter((item) => [1, 2, 5].includes(item.id)) : steps;

  return (
    <Card className="border border-border bg-white p-0 shadow-sm">
      <div className="border-b border-border/70 p-5">
        <div className={completionMode ? "grid gap-3 md:grid-cols-3" : "grid gap-3 md:grid-cols-5"}>
          {visibleSteps.map((item) => {
            const isActive = item.id === step;
            const isDone = item.id < step;
            const hasMissingFields = item.fieldPrefix
              ? missingFields.some((field) => field.startsWith(item.fieldPrefix))
              : missingFields.length > 0;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id < step) setStep(item.id);
                }}
                className="flex min-h-12 items-center gap-3 rounded-xl border border-border/70 bg-white px-3 py-2 text-left disabled:cursor-default"
                disabled={item.id >= step}
              >
                <span
                  className={
                    isDone
                      ? "flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white"
                      : isActive
                        ? "flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-white"
                        : "flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500"
                  }
                >
                  {isDone ? <CheckCircle2 className="size-4" /> : item.id}
                </span>
                <span className={isActive ? "text-sm font-semibold text-ink" : "text-sm font-medium text-ink-soft"}>
                  {item.label}
                </span>
                {completionMode && hasMissingFields ? (
                  <AlertTriangle className="ml-auto size-4 shrink-0 text-amber-500" aria-label="Campos pendientes" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={onSubmit} className="grid gap-6 p-5 md:p-7">
        {isLoadingPrefill ? (
          <div className="flex items-center gap-2 rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-800">
            <Loader2 className="size-4 animate-spin" />
            Cargando datos existentes del trabajador
          </div>
        ) : null}

        {completionMode && !isLoadingPrefill && missingFields.length > 0 ? (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>Completa los campos pendientes marcados antes de guardar la ficha.</span>
          </div>
        ) : null}

        {catalogs.isLoading && step !== 1 ? (
          <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <Loader2 className="size-4 animate-spin" />
            Cargando catalogos actualizados
          </div>
        ) : null}

        {step === 1 ? <PersonalDataForm form={form} /> : null}
        {step === 2 ? <LaborDataForm form={form} catalogs={catalogs} preservePositionOnAreaChange={completionMode} /> : null}
        {step === 3 ? <ContractDataForm form={form} catalogs={catalogs} /> : null}
        {step === 4 ? <AccessDataForm form={form} roles={catalogs.roles} /> : null}
        {step === 5 ? <OnboardingSummary form={form} catalogs={catalogs} completionMode={completionMode} /> : null}

        {completionSaved ? (
          <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            <span>Perfil laboral completado correctamente.</span>
          </div>
        ) : null}

        {completionWarnings.length ? (
          <div className="grid gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            {completionWarnings.map((warning) => (
              <div key={`${warning.field || "warning"}-${warning.message}`} className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>{warning.message}</span>
              </div>
            ))}
          </div>
        ) : null}

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
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{globalError}</span>
          </div>
        ) : null}

        {step <= 5 ? (
          <div className="flex flex-col gap-3 border-t border-border/70 pt-5 sm:flex-row sm:justify-between">
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={prevStep} disabled={step === 1 || isSubmitting} className="gap-2">
                <ArrowLeft className="size-4" />
                Anterior
              </Button>
              <Button type="button" variant="ghost" disabled={isSubmitting} className="gap-2">
                <Save className="size-4" />
                Guardar borrador
              </Button>
            </div>

            {step < 5 ? (
              <Button type="button" onClick={() => void nextStep()} disabled={isSubmitting || catalogs.isLoading} className="gap-2">
                Siguiente
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
                {isSubmitting
                  ? (completionMode ? "Guardando informacion" : "Creando trabajador")
                  : (completionMode ? "Completar informacion" : "Crear trabajador")}
              </Button>
            )}
          </div>
        ) : null}
      </form>
    </Card>
  );
}
