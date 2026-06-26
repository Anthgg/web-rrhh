"use client";

import { useState } from "react";
import { Clock, Zap, X, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";

interface OvertimeActivationModalProps {
  attendanceId: string;
  workerName: string;
  authorizedBy?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const PRESET_MINUTES = [30, 60, 90, 120, 180, 240];

async function activateOvertime(attendanceId: string, maxOvertimeMinutes: number) {
  return apiClient<{
    success: boolean;
    message: string;
    data: { attendanceId: string; maxOvertimeMinutes: number };
  }>("/api/mobile/overtime/activate", {
    method: "POST",
    body: { attendanceId, maxOvertimeMinutes },
  });
}

export function OvertimeActivationModal({
  attendanceId,
  workerName,
  authorizedBy,
  onClose,
  onSuccess,
}: OvertimeActivationModalProps) {
  const [maxMinutes, setMaxMinutes] = useState(60);
  const [customValue, setCustomValue] = useState("");
  const [useCustom, setUseCustom] = useState(false);

  const finalMinutes = useCustom ? parseInt(customValue || "0", 10) : maxMinutes;

  const mutation = useMutation({
    mutationFn: () => activateOvertime(attendanceId, finalMinutes),
    onSuccess: (data) => {
      toast.success(data?.message || "Horas extra activadas correctamente.", {
        description: `Se autorizaron hasta ${finalMinutes} minutos de hora extra para ${workerName}.`,
      });
      onSuccess();
      onClose();
    },
    onError: (err: unknown) => {
      const e = err as { message?: string };
      toast.error(e?.message || "No se pudo activar las horas extra. Intente de nuevo.");
    },
  });

  const isValid = finalMinutes > 0 && finalMinutes <= 480;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ot-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
            <Zap className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="ot-modal-title"
              className="text-base font-semibold text-foreground"
            >
              Autorizar Horas Extra
            </h2>
            <div className="flex items-center gap-2 mt-0.5 min-w-0">
              <span className="truncate text-xs font-semibold text-muted-foreground">{workerName}</span>
              {authorizedBy && (
                <>
                  <span className="text-muted-foreground/40 text-xs">•</span>
                  <span className="inline-flex items-center rounded-full bg-slate-500/10 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 border border-slate-500/10 truncate">
                    Por: {authorizedBy}
                  </span>
                </>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            aria-label="Cerrar modal"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 px-5 py-5">
          {/* Info Banner */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 p-3.5">
            <div className="flex items-start gap-2.5">
              <Clock className="mt-0.5 size-4 shrink-0 text-amber-500" />
              <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-400">
                Autoriza tiempo extra para este colaborador cuyo turno está finalizando o ha terminado
                en los últimos 30 minutos. El máximo autorizable es de{" "}
                <strong>480 minutos (8 horas)</strong>.
              </p>
            </div>
          </div>

          {/* Preset Buttons */}
          <div>
            <label className="mb-2.5 block text-sm font-medium text-foreground">
              Tiempo máximo autorizado
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_MINUTES.map((min) => (
                <button
                  key={min}
                  type="button"
                  onClick={() => {
                    setMaxMinutes(min);
                    setUseCustom(false);
                  }}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all ${
                    !useCustom && maxMinutes === min
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-muted/40 text-foreground hover:bg-muted hover:border-primary/40"
                  }`}
                >
                  {min >= 60 ? `${min / 60}h` : `${min}m`}
                  <span className="block text-[10px] font-normal opacity-70">
                    {min} min
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Input */}
          <div>
            <button
              type="button"
              onClick={() => setUseCustom((v) => !v)}
              className="mb-2 flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              {useCustom ? "✓ " : ""}Ingresar valor personalizado (minutos)
            </button>
            {useCustom && (
              <input
                id="ot-custom-minutes"
                type="number"
                min={1}
                max={480}
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                placeholder="Ej: 45"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                aria-label="Minutos personalizados de horas extra"
                autoFocus
              />
            )}
          </div>

          {/* Summary */}
          <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Se autorizarán hasta{" "}
              <strong className="text-foreground">
                {isValid ? `${finalMinutes} min (${(finalMinutes / 60).toFixed(1)}h)` : "—"}
              </strong>{" "}
              de horas extra para{" "}
              <strong className="text-foreground">{workerName}</strong>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2.5 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            id="ot-confirm-btn"
            onClick={() => mutation.mutate()}
            disabled={!isValid || mutation.isPending}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Autorizando...
              </>
            ) : (
              <>
                <Zap className="size-4" />
                Autorizar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
