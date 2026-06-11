"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shield, Key, Loader2, Check, X, AlertTriangle, Monitor, ShieldAlert } from "lucide-react";
import { FieldFrame, Input } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
import type { ChangePasswordFormValues, UserProfile } from "@/types";
import { ProfileSectionCard } from "./ProfileSectionCard";

// Strong client-side validation schema
const passwordSchema = z
 .object({
 currentPassword: z.string().min(1, "Ingresa la contraseña actual."),
 newPassword: z
 .string()
 .min(8, "La nueva contraseña debe tener al menos 8 caracteres.")
 .regex(/[A-Z]/, "Debe contener al menos una letra mayúscula.")
 .regex(/[a-z]/, "Debe contener al menos una letra minúscula.")
 .regex(/[0-9]/, "Debe contener al menos un número.")
 .regex(/[^A-Za-z0-9]/, "Debe contener al menos un símbolo especial."),
 confirmPassword: z.string().min(1, "Confirma la nueva contraseña."),
 })
 .refine((data) => data.newPassword === data.confirmPassword, {
 message: "Las contraseñas no coinciden.",
 path: ["confirmPassword"],
 })
 .refine((data) => data.newPassword !== data.currentPassword, {
 message: "La nueva contraseña debe ser diferente de la contraseña actual.",
 path: ["newPassword"],
 });

interface ProfileSecurityTabProps {
 user: UserProfile;
 /** Called with only currentPassword + newPassword — confirmPassword is stripped by workspace */
 onChangePassword: (values: ChangePasswordFormValues) => Promise<void>;
 isPending: boolean;
}

export function ProfileSecurityTab({ user, onChangePassword, isPending }: ProfileSecurityTabProps) {
 // Real values from backend — no hardcoded fallbacks
 const lastLogin = user.lastLoginAt
 ? new Date(user.lastLoginAt).toLocaleString("es-PE", { timeZone: "America/Lima" })
 : null;

 const activeSessions = user.security?.active_sessions ?? null;
 const isEmailVerified = user.security?.email_verified ?? null; // three-state
 const passwordChangeRequired = user.security?.password_change_required ?? null;
 const failedLoginAttempts = user.security?.failed_login_attempts ?? null;

 const {
 register,
 handleSubmit,
 reset,
 watch,
 formState: { errors },
 } = useForm<ChangePasswordFormValues>({
 resolver: zodResolver(passwordSchema),
 defaultValues: {
 currentPassword: "",
 newPassword: "",
 confirmPassword: "",
 },
 });

 const newPasswordValue = watch("newPassword", "");

 const requirements = [
 { label: "Mínimo 8 caracteres", met: newPasswordValue.length >= 8 },
 { label: "Una letra mayúscula", met: /[A-Z]/.test(newPasswordValue) },
 { label: "Una letra minúscula", met: /[a-z]/.test(newPasswordValue) },
 { label: "Al menos un número", met: /[0-9]/.test(newPasswordValue) },
 { label: "Un símbolo especial (ej. @, #, $)", met: /[^A-Za-z0-9]/.test(newPasswordValue) },
 ];

 const onSubmitForm = async (data: ChangePasswordFormValues) => {
 // confirmPassword lives only in the form — workspace handler strips it before the API call
 await onChangePassword(data);
 reset();
 };

 return (
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full items-start">
 {/* Left column: password form */}
 <div className="lg:col-span-2 flex flex-col gap-6 w-full">

 {/* Password-change required alert */}
 {passwordChangeRequired === true && (
 <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
 <AlertTriangle className="size-5 text-amber-500 shrink-0 mt-0.5" />
 <div>
 <p className="text-sm font-bold text-amber-600 dark:text-amber-500">Cambio de contraseña obligatorio</p>
 <p className="text-xs text-foreground/80 mt-0.5">
 El administrador requiere que actualices tu contraseña antes de continuar.
 </p>
 </div>
 </div>
 )}

 <ProfileSectionCard
 title="Cambiar Contraseña"
 description="Actualiza tus credenciales de acceso para mantener la cuenta segura."
 icon={<Key className="size-5" />}
 >
 <form onSubmit={handleSubmit(onSubmitForm)} className="grid gap-5">
 <FieldFrame label="Contraseña Actual" error={errors.currentPassword?.message}>
 <Input type="password" {...register("currentPassword")} disabled={isPending} />
 </FieldFrame>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <FieldFrame label="Nueva Contraseña" error={errors.newPassword?.message}>
 <Input type="password" {...register("newPassword")} disabled={isPending} />
 </FieldFrame>

 <FieldFrame label="Confirmar Nueva Contraseña" error={errors.confirmPassword?.message}>
 <Input type="password" {...register("confirmPassword")} disabled={isPending} />
 </FieldFrame>
 </div>

 {/* Checklist visual of requirements */}
 <div className="p-4 bg-muted border border-border rounded-xl">
 <span className="text-xs font-bold text-muted-foreground block mb-2">Requisitos de la nueva contraseña:</span>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
 {requirements.map((req, idx) => (
 <div key={req.label || idx} className="flex items-center gap-2 text-xs">
 {req.met ? (
 <Check className="size-4 text-emerald-600 dark:text-emerald-500 bg-emerald-500/10 rounded-full p-0.5 shrink-0" />
 ) : (
 <X className="size-4 text-muted-foreground bg-border rounded-full p-0.5 shrink-0" />
 )}
 <span className={req.met ? "text-emerald-600 dark:text-emerald-500 font-semibold" : "text-muted-foreground"}>
 {req.label}
 </span>
 </div>
 ))}
 </div>
 </div>

 <div className="flex justify-end pt-2">
 <Button
 type="submit"
 disabled={isPending}
 className="rounded-xl h-10 px-5 shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
 >
 {isPending && <Loader2 className="size-4 animate-spin" />}
 Actualizar Contraseña
 </Button>
 </div>
 </form>
 </ProfileSectionCard>
 </div>

 {/* Right column: security metadata */}
 <div className="flex flex-col gap-6 w-full">
 <ProfileSectionCard
 title="Seguridad de Acceso"
 description="Información de acceso y estado de la sesión."
 icon={<Shield className="size-5" />}
 >
 <div className="flex flex-col gap-4 text-sm">
 {/* Email verified */}
 <div className="flex items-center justify-between border-b border-border/50 pb-2">
 <span className="text-muted-foreground font-semibold">Correo Verificado</span>
 {isEmailVerified === null ? (
 <span className="text-xs text-muted-foreground/60 italic">No registrado</span>
 ) : (
 <span
 className={`font-bold text-xs px-2.5 py-1 rounded-md ${
 isEmailVerified
 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20"
 : "bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20"
 }`}
 >
 {isEmailVerified ? "Verificado" : "Pendiente"}
 </span>
 )}
 </div>

 {/* Password change required */}
 <div className="flex items-center justify-between border-b border-border/50 pb-2">
 <span className="text-muted-foreground font-semibold">Cambio de Contraseña</span>
 {passwordChangeRequired === null ? (
 <span className="text-xs text-muted-foreground/60 italic">No registrado</span>
 ) : (
 <span
 className={`font-bold text-xs px-2.5 py-1 rounded-md ${
 passwordChangeRequired
 ? "bg-destructive/10 text-destructive border border-destructive/20"
 : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20"
 }`}
 >
 {passwordChangeRequired ? "Requerido" : "No requerido"}
 </span>
 )}
 </div>

 {/* Active sessions */}
 <div className="flex items-center justify-between border-b border-border/50 pb-2">
 <span className="text-muted-foreground font-semibold">Sesiones Activas</span>
 {activeSessions === null ? (
 <span className="text-xs text-muted-foreground/60 italic">No registrado</span>
 ) : (
 <span className="font-bold text-foreground">
 {activeSessions} {activeSessions === 1 ? "dispositivo" : "dispositivos"}
 </span>
 )}
 </div>

 {/* Failed login attempts */}
 <div className="flex items-center justify-between border-b border-border/50 pb-2">
 <span className="text-muted-foreground font-semibold">Intentos Fallidos</span>
 {failedLoginAttempts === null ? (
 <span className="text-xs text-muted-foreground/60 italic">No registrado</span>
 ) : (
 <span
 className={`font-bold text-xs px-2.5 py-1 rounded-md ${
 failedLoginAttempts > 0
 ? "bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20"
 : "bg-muted text-muted-foreground border border-border"
 }`}
 >
 {failedLoginAttempts}
 </span>
 )}
 </div>

 {/* Last access */}
 <div className="flex flex-col gap-1 border-b border-border/50 pb-2">
 <span className="text-muted-foreground font-semibold text-xs">Último Acceso</span>
 <span className="font-bold text-foreground text-xs mt-0.5">
 {lastLogin ?? <span className="text-muted-foreground/60 italic font-normal">No registrado</span>}
 </span>
 </div>

 {/* 2FA — coming soon */}
 <div className="flex items-center justify-between">
 <span className="text-muted-foreground font-semibold">Doble Factor (2FA)</span>
 <span className="text-xs font-bold text-muted-foreground/60 bg-muted border border-border px-2 py-0.5 rounded">
 Próximamente
 </span>
 </div>

 <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-start gap-2.5 mt-1">
 <Monitor className="size-4 text-primary shrink-0 mt-0.5" />
 <div className="flex flex-col gap-0.5">
 <span className="text-xs font-bold text-foreground">Dispositivo Actual</span>
 <span className="text-[11px] text-foreground/80">Sesión web de administración activa</span>
 </div>
 </div>
 </div>
 </ProfileSectionCard>

 {/* Security tips */}
 <div className="p-4 bg-muted border border-border rounded-xl flex items-start gap-2.5">
 <ShieldAlert className="size-4 text-muted-foreground shrink-0 mt-0.5" />
 <p className="text-[11px] text-muted-foreground leading-relaxed">
 Cambia tu contraseña regularmente. Al cambiarla se cerrarán otras sesiones activas.
 </p>
 </div>
 </div>
 </div>
 );
}
