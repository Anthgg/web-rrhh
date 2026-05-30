"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle, Clock, Loader2, RefreshCcw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { onboardingService } from "../services/onboarding.service";

interface OnboardingStatusChecklistProps {
  workerId: string;
}

export function OnboardingStatusChecklist({ workerId }: OnboardingStatusChecklistProps) {
  const statusQuery = useQuery({
    queryKey: ["onboarding-status", workerId],
    queryFn: () => onboardingService.getOnboardingStatus(workerId),
    refetchInterval: 10000, // Poll every 10s
    enabled: Boolean(workerId),
  });

  if (statusQuery.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-3">
        <Loader2 className="size-8 animate-spin text-indigo-600" />
        <span className="text-xs text-slate-500 font-medium">Cargando estado del onboarding...</span>
      </div>
    );
  }

  if (statusQuery.isError || !statusQuery.data) {
    return (
      <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-6 text-center space-y-3">
        <AlertTriangle className="size-8 text-rose-600 mx-auto" />
        <h4 className="text-sm font-semibold text-rose-950">No pudimos obtener el estado</h4>
        <p className="text-xs text-rose-800/80">
          Ocurrió un error al consultar el progreso con el servidor central.
        </p>
        <Button
          type="button"
          onClick={() => void statusQuery.refetch()}
          className="mx-auto text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
        >
          <RefreshCcw className="size-3" /> Intentar de nuevo
        </Button>
      </div>
    );
  }

  const status = statusQuery.data.data;

  const checklistItems = [
    {
      key: "worker_created",
      label: "Creación de ficha personal del colaborador",
      description: "Datos personales, familiares y contactos de emergencia guardados.",
      isCompleted: status.worker_created,
    },
    {
      key: "contract_generated",
      label: "Generación de plantilla contractual (PDF)",
      description: "Condiciones contractuales, salario y periodo de prueba establecidos.",
      isCompleted: status.contract_generated,
    },
    {
      key: "user_created",
      label: "Creación de cuenta de acceso y envío de accesos",
      description: "Usuario registrado en el directorio e invitación enviada por correo corporativo.",
      isCompleted: status.user_created,
    },
    {
      key: "signed_contract_uploaded",
      label: "Carga y archivo del contrato firmado",
      description: "Carga final del documento físico o digital firmado por el colaborador.",
      isCompleted: status.signed_contract_uploaded,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-xl p-4">
        <div>
          <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Progreso del Registro</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            {status.completed
              ? "Onboarding completado satisfactoriamente."
              : "Pendiente de completar los siguientes pasos."}
          </p>
        </div>
        <Button
          type="button"
          disabled={statusQuery.isRefetching}
          onClick={() => void statusQuery.refetch()}
          className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center gap-1.5 text-xs"
        >
          {statusQuery.isRefetching ? (
            <Loader2 className="size-3.5 animate-spin text-slate-500" />
          ) : (
            <RefreshCcw className="size-3.5 text-slate-500" />
          )}
          Actualizar
        </Button>
      </div>

      <div className="space-y-4">
        {checklistItems.map((item, idx) => (
          <div
            key={item.key}
            className={`flex items-start gap-4 p-4 rounded-xl border transition ${
              item.isCompleted
                ? "border-emerald-100 bg-emerald-50/20"
                : "border-slate-100 bg-white"
            }`}
          >
            <div className="mt-0.5">
              {item.isCompleted ? (
                <CheckCircle2 className="size-5 text-emerald-600" />
              ) : idx === 3 && !status.signed_contract_uploaded ? (
                <Clock className="size-5 text-amber-500 animate-pulse" />
              ) : (
                <Circle className="size-5 text-slate-300" />
              )}
            </div>
            <div className="flex-1 space-y-1">
              <span
                className={`text-sm font-semibold block ${
                  item.isCompleted ? "text-emerald-900" : "text-slate-800"
                }`}
              >
                {item.label}
              </span>
              <span className="text-xs text-slate-500 block">{item.description}</span>
            </div>
          </div>
        ))}
      </div>

      {status.completed && (
        <div className="rounded-xl bg-emerald-600 text-white p-4 text-center text-xs font-semibold">
          ¡Proceso de alta finalizado! El colaborador ya está listo para iniciar labores y usar el sistema.
        </div>
      )}
    </div>
  );
}
