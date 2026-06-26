"use client";

import { Info } from "lucide-react";

interface SessionExpiredAlertProps {
  reason: string | null;
}

/**
 * Soft, non-alarming notice shown above the form when the user lands here
 * because their session expired (?reason=session-expired) or was revoked.
 */
export function SessionExpiredAlert({ reason }: SessionExpiredAlertProps) {
  if (reason !== "session-expired" && reason !== "session-revoked") return null;

  const message =
    reason === "session-revoked"
      ? "Tu sesión se cerró desde otro dispositivo. Inicia sesión nuevamente para continuar."
      : "Tu sesión expiró. Inicia sesión nuevamente para continuar.";

  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-amber-300"
    >
      <Info className="mt-0.5 size-[18px] shrink-0 text-amber-400" aria-hidden />
      <p className="text-[13px] leading-relaxed">{message}</p>
    </div>
  );
}
