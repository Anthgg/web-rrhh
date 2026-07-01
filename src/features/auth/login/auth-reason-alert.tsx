"use client";

import { Info, ShieldAlert } from "lucide-react";

interface AuthReasonAlertProps {
  reason: string | null;
}

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
    <output
      aria-live="polite"
      className={
        isWarning
          ? "flex items-start gap-3 rounded-xl border border-[#a07840]/20 bg-[#a07840]/[0.07] p-3.5 text-[#6f512c]"
          : "flex items-start gap-3 rounded-xl border border-[#547a78]/20 bg-[#547a78]/[0.07] p-3.5 text-[#315f60]"
      }
    >
      {isWarning ? (
        <ShieldAlert className="mt-0.5 size-[18px] shrink-0 text-[#8a6534]" strokeWidth={1.8} aria-hidden />
      ) : (
        <Info className="mt-0.5 size-[18px] shrink-0 text-[#547a78]" strokeWidth={1.8} aria-hidden />
      )}
      <p className="text-[13px] font-medium leading-relaxed">{message}</p>
    </output>
  );
}
