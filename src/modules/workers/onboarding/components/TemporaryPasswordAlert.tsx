"use client";

import React, { useState } from "react";
import { Copy, Check, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TemporaryPasswordAlertProps {
  password?: string;
}

export function TemporaryPasswordAlert({ password }: TemporaryPasswordAlertProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!password) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/50 p-5 space-y-4">
      <div className="flex gap-3">
        <AlertTriangle className="size-6 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-amber-900 font-semibold">¡Atención! Copia la Contraseña Temporal</h4>
          <p className="text-xs text-amber-800/80 mt-1">
            Por motivos de seguridad, esta contraseña temporal solo se muestra ahora. Asegúrate de copiarla y entregarla al colaborador antes de salir de esta pantalla.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-amber-200">
        <div className="flex-1 font-mono text-sm font-bold text-slate-800 tracking-widest pl-2">
          {showPassword ? password : "••••••••••••"}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowPassword(!showPassword)}
            className="size-9 rounded-lg p-0 flex items-center justify-center border border-slate-200 hover:bg-slate-50"
          >
            {showPassword ? <EyeOff className="size-4 text-slate-500" /> : <Eye className="size-4 text-slate-500" />}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleCopy}
            className="h-9 px-3 rounded-lg text-xs border border-slate-200 hover:bg-slate-50 flex items-center gap-1.5 font-semibold text-indigo-700"
          >
            {copied ? (
              <>
                <Check className="size-4 text-emerald-600 animate-scaleIn" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="size-4" />
                Copiar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
