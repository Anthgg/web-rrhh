"use client";

import { Info, ShieldAlert } from "lucide-react";

interface AuthReasonAlertProps {
  reason: string | null;
}

/**
 * Premium, sober alert shown above the login form when a redirect reason is present.
 */
export function AuthReasonAlert({ reason }: AuthReasonAlertProps) {
  if (!reason) return null;

  let message = "";
  let isWarning = false;

  if (reason === "session-expired") {
    message = "Tu sesión expiró. Inicia sesión nuevamente para continuar.";
    isWarning = true;
  } else if (reason === "session-revoked") {
    message = "Tu sesión fue cerrada desde otro dispositivo. Inicia sesión de nuevo.";
    isWarning = true;
  } else if (reason === "auth-required") {
    message = "Debes iniciar sesión para acceder al panel.";
    isWarning = false;
  } else {
    return null;
  }

  return (
    <div
      role="status"
      className={
        isWarning
          ? "flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-3.5 text-amber-200"
          : "flex items-start gap-3 rounded-2xl border border-cyan-500/25 bg-cyan-500/10 p-3.5 text-cyan-200"
      }
    >
      {isWarning ? (
        <ShieldAlert className="mt-0.5 size-[18px] shrink-0 text-amber-400" aria-hidden />
      ) : (
        <Info className="mt-0.5 size-[18px] shrink-0 text-cyan-400" aria-hidden />
      )}
      <p className="text-[13px] leading-relaxed font-medium">{message}</p>
    </div>
  );
}
