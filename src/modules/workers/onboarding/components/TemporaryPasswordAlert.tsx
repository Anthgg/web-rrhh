"use client";

import { AlertTriangle } from "lucide-react";
import { TemporaryPasswordReveal } from "@/components/security/TemporaryPasswordReveal";

interface TemporaryPasswordAlertProps {
  password?: string;
}

export function TemporaryPasswordAlert({ password }: TemporaryPasswordAlertProps) {
  if (!password) return null;

  return (
    <div className="space-y-4 rounded-2xl border-2 border-amber-300 bg-amber-50/50 p-5">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 size-6 flex-shrink-0 text-amber-600" />
        <div>
          <h4 className="text-sm font-semibold text-amber-900">Atencion: copia la contrasena temporal</h4>
          <p className="mt-1 text-xs text-amber-800/80">
            Por motivos de seguridad, esta contrasena temporal solo se conserva en memoria. Para verla o copiarla debes verificar tu contrasena de administrador.
          </p>
        </div>
      </div>

      <TemporaryPasswordReveal password={password} />
    </div>
  );
}
