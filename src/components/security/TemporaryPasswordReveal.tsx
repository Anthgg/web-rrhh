"use client";

import { useState } from "react";
import { Check, Copy, Eye, EyeOff, Loader2, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/fields";
import { authService } from "@/services/auth.service";

interface TemporaryPasswordRevealProps {
  password: string;
  label?: string;
  onRevealChange?: (revealed: boolean) => void;
}

export function TemporaryPasswordReveal({
  password,
  label = "Contrasena temporal",
  onRevealChange,
}: TemporaryPasswordRevealProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  const maskedValue = password ? "*".repeat(Math.max(10, Math.min(password.length, 18))) : "**********";

  const reveal = () => {
    if (isRevealed) {
      setIsRevealed(false);
      onRevealChange?.(false);
      return;
    }

    setIsVerifyOpen(true);
  };

  const verifyAndReveal = async () => {
    try {
      setIsVerifying(true);
      await authService.verifyPassword(adminPassword);
      setIsRevealed(true);
      onRevealChange?.(true);
      setIsVerifyOpen(false);
      setAdminPassword("");
    } catch {
      toast.error("No se pudo verificar la contrasena de administrador.");
    } finally {
      setIsVerifying(false);
    }
  };

  const copyPassword = async () => {
    if (!isRevealed) {
      setIsVerifyOpen(true);
      return;
    }

    await navigator.clipboard.writeText(password);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <>
      <div className="grid gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</span>
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-white p-2">
          <span className="min-w-0 flex-1 select-all truncate px-2 font-mono text-sm font-semibold tracking-wider text-ink">
            {isRevealed ? password : maskedValue}
          </span>
          <Button
            type="button"
            variant="secondary"
            className="size-9 rounded-xl p-0"
            onClick={reveal}
            aria-label={isRevealed ? "Ocultar contrasena temporal" : "Revelar contrasena temporal"}
          >
            {isRevealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-9 gap-1.5 rounded-xl px-3 text-xs"
            onClick={copyPassword}
          >
            {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
            {copied ? "Copiado" : "Copiar"}
          </Button>
        </div>
      </div>

      {isVerifyOpen ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                  <ShieldCheck className="size-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-ink">Verifica tu identidad</h3>
                  <p className="mt-1 text-sm text-ink-soft">
                    Por seguridad, ingresa tu contrasena de administrador para ver la contrasena temporal.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="rounded-xl p-2 text-ink-soft hover:bg-slate-100"
                onClick={() => setIsVerifyOpen(false)}
                aria-label="Cerrar verificacion"
              >
                <X className="size-4" />
              </button>
            </div>

            <Input
              type="password"
              value={adminPassword}
              onChange={(event) => setAdminPassword(event.target.value)}
              placeholder="Contrasena de administrador"
              autoComplete="current-password"
              autoFocus
              onKeyDown={(event) => {
                if (event.key === "Enter" && adminPassword && !isVerifying) {
                  void verifyAndReveal();
                }
              }}
            />

            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsVerifyOpen(false)}
                disabled={isVerifying}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={verifyAndReveal}
                disabled={!adminPassword || isVerifying}
                className="gap-2"
              >
                {isVerifying ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                Verificar
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
