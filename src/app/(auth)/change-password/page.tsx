"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Lock, Check, X, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/features/auth/auth-provider";
import { authService } from "@/services/auth.service";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { FieldFrame } from "@/components/ui/fields";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { refreshSession } = useSession();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Policy checks
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const matchesConfirm = newPassword.length > 0 && newPassword === confirmPassword;
  const isDifferentFromCurrent = newPassword.length > 0 && currentPassword.length > 0 && newPassword !== currentPassword;

  const isFormValid =
    hasMinLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumber &&
    hasSpecial &&
    matchesConfirm &&
    isDifferentFromCurrent;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      toast.error("La nueva contraseña no cumple con todas las políticas requeridas.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      // Call POST /auth/change-password or /api/auth/change-password
      await authService.changePassword({
        currentPassword,
        newPassword,
      });

      toast.success("Contraseña actualizada con éxito.");

      // Refresh /api/auth/me or /auth/me to verify user state
      await apiClient("/api/auth/me").catch(() => apiClient("/auth/me")).catch(() => null);

      // Refresh session state in provider
      const updatedUser = await refreshSession();
      if (updatedUser) {
        // Explicitly clear temporary flag if refresh didn't
        (updatedUser as any).forcePasswordChange = false;
        (updatedUser as any).passwordChangeRequired = false;
      }

      router.replace("/dashboard");
    } catch (err: any) {
      const msg = err?.message || "Ocurrió un error al intentar cambiar la contraseña.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const checklistItems = [
    { label: "Mínimo 8 caracteres", met: hasMinLength },
    { label: "Al menos una letra mayúscula", met: hasUppercase },
    { label: "Al menos una letra minúscula", met: hasLowercase },
    { label: "Al menos un número", met: hasNumber },
    { label: "Al menos un carácter especial (símbolo)", met: hasSpecial },
    { label: "Diferente a la contraseña actual", met: isDifferentFromCurrent },
    { label: "Las contraseñas coinciden", met: matchesConfirm },
  ];

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-teal-800 via-teal-900 to-emerald-950 p-4">
      {/* Background decorative elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 size-96 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute bottom-20 right-10 size-96 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-card border border-border/60 rounded-3xl p-6 shadow-2xl space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-2">
            <div className="relative size-8 overflow-hidden rounded-lg bg-primary/10 p-1">
              <Image
                src="/logo.png"
                alt="FABRYOR"
                fill
                sizes="32px"
                className="object-contain"
                priority
              />
            </div>
            <span className="text-md font-bold tracking-tight text-foreground">FABRYOR</span>
          </div>

          <div className="size-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-2">
            <Lock className="size-6" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Cambio de Contraseña Obligatorio</h2>
          <p className="text-xs text-muted-foreground max-w-sm">
            Por motivos de seguridad, debes actualizar la contraseña temporal asignada a tu cuenta antes de acceder al panel.
          </p>
        </div>

        {errorMessage && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl p-3.5 flex items-start gap-2.5">
            <AlertCircle className="size-4 mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldFrame label="Contraseña Actual">
            <div className="relative flex items-center">
              <input
                type={showCurrent ? "text" : "password"}
                placeholder="Ingresa tu contraseña temporal"
                className="w-full h-11 rounded-2xl border border-border bg-background px-4 pr-10 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isSubmitting}
                required
              />
              <button
                type="button"
                className="absolute right-3 text-muted-foreground hover:text-foreground"
                onClick={() => setShowCurrent(!showCurrent)}
                disabled={isSubmitting}
              >
                {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </FieldFrame>

          <FieldFrame label="Nueva Contraseña">
            <div className="relative flex items-center">
              <input
                type={showNew ? "text" : "password"}
                placeholder="Establece tu nueva contraseña"
                className="w-full h-11 rounded-2xl border border-border bg-background px-4 pr-10 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isSubmitting}
                required
              />
              <button
                type="button"
                className="absolute right-3 text-muted-foreground hover:text-foreground"
                onClick={() => setShowNew(!showNew)}
                disabled={isSubmitting}
              >
                {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </FieldFrame>

          <FieldFrame label="Confirmar Nueva Contraseña">
            <div className="relative flex items-center">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Repite la nueva contraseña"
                className="w-full h-11 rounded-2xl border border-border bg-background px-4 pr-10 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
                required
              />
              <button
                type="button"
                className="absolute right-3 text-muted-foreground hover:text-foreground"
                onClick={() => setShowConfirm(!showConfirm)}
                disabled={isSubmitting}
              >
                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </FieldFrame>

          {/* Policy Checklist */}
          <div className="bg-muted/30 border border-border rounded-2xl p-4 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Políticas de Contraseña
            </h4>
            <ul className="space-y-1.5">
              {checklistItems.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                  {item.met ? (
                    <Check className="size-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <X className="size-3.5 text-muted-foreground/40 shrink-0" />
                  )}
                  <span className={item.met ? "text-emerald-500 font-medium" : ""}>
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full inline-flex items-center gap-2 rounded-2xl font-bold"
            disabled={isSubmitting || !isFormValid}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Actualizando Contraseña...
              </>
            ) : (
              "Establecer Contraseña"
            )}
          </Button>
        </form>
      </div>
    </main>
  );
}
