"use client";

import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Loader2, Save, UserPlus } from "lucide-react";
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
  { id: 1, label: "Datos personales" },
  { id: 2, label: "Datos laborales" },
  { id: 3, label: "Sueldo y condiciones" },
  { id: 4, label: "Acceso al sistema" },
  { id: 5, label: "Confirmacion final" },
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
    catalogs,
  } = useWorkerOnboarding();

  const contractId = registrationResult?.contract_id;
  const workerId = registrationResult?.worker_id;

  return (
    <Card className="border border-border bg-white p-0 shadow-sm">
      <div className="border-b border-border/70 p-5">
        <div className="grid gap-3 md:grid-cols-5">
          {steps.map((item) => {
            const isActive = item.id === step;
            const isDone = item.id < step;

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
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={onSubmit} className="grid gap-6 p-5 md:p-7">
        {catalogs.isLoading && step !== 1 ? (
          <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <Loader2 className="size-4 animate-spin" />
            Cargando catalogos actualizados...
          </div>
        ) : null}

        {step === 1 ? <PersonalDataForm form={form} /> : null}
        {step === 2 ? <LaborDataForm form={form} catalogs={catalogs} /> : null}
        {step === 3 ? <ContractDataForm form={form} catalogs={catalogs} /> : null}
        {step === 4 ? <AccessDataForm form={form} roles={catalogs.roles} /> : null}
        {step === 5 ? <OnboardingSummary form={form} catalogs={catalogs} /> : null}

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
                {isSubmitting ? "Creando trabajador..." : "Crear trabajador"}
              </Button>
            )}
          </div>
        ) : null}
      </form>
    </Card>
  );
}
