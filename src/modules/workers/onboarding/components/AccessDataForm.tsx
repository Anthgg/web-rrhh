"use client";

import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import {
 AlertCircle,
 CheckCircle2,
 Copy,
 Eye,
 EyeOff,
 Info,
 Loader2,
 Lock,
 RefreshCw,
 ShieldCheck,
 Sparkles,
 XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldFrame, Input, Select } from "@/components/ui/fields";
import {
 useCredentialSuggestion,
 validateTemporaryPassword,
 isTemporaryPasswordValid,
} from "../hooks/useCredentialSuggestion";
import type { OnboardingFormValues } from "../schemas/onboarding.schema";
import type { CatalogItem } from "../types/onboarding.types";

interface AccessDataFormProps {
 form: UseFormReturn<OnboardingFormValues>;
 roles: CatalogItem[];
}

const PASSWORD_RULES = [
 { key: "minLength", label: "Mínimo 8 caracteres" },
 { key: "uppercase", label: "Una letra mayúscula" },
 { key: "lowercase", label: "Una letra minúscula" },
 { key: "number", label: "Un número" },
 { key: "symbol", label: "Un símbolo (!@#$%&*-_=+?)" },
] as const;

function PasswordStrength({ password }: { password: string }) {
 if (!password) return null;
 const checks = validateTemporaryPassword(password);
 const allValid = isTemporaryPasswordValid(password);

 return (
 <div className="mt-2 space-y-1">
 {PASSWORD_RULES.map(({ key, label }) => {
 const ok = checks[key];
 return (
 <div key={key} className="flex items-center gap-1.5 text-[11px]">
 {ok
 ? <CheckCircle2 className="size-3 shrink-0 text-emerald-500" />
 : <XCircle className="size-3 shrink-0 text-rose-400" />
 }
 <span className={ok ? "text-emerald-700 font-medium" : "text-rose-500"}>{label}</span>
 </div>
 );
 })}
 {allValid && (
 <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
 <ShieldCheck className="size-3.5 shrink-0" />
 Contraseña segura
 </div>
 )}
 </div>
 );
}

interface AccessStatusCardProps {
 register: any;
}

export function AccessStatusCard({ register }: AccessStatusCardProps) {
 return (
 <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <div className="flex items-center gap-3">
 <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
 <Lock className="size-5" />
 </div>
 <div>
 <h4 className="text-sm font-semibold text-foreground">
 Crear usuario de acceso al sistema
 </h4>
 <p className="text-xs text-muted-foreground">
 Activa esta opción para generar usuario, contraseña temporal y rol del sistema.
 </p>
 </div>
 </div>
 <label className="relative inline-flex cursor-pointer items-center shrink-0">
 <input type="checkbox" className="peer sr-only" {...register("accessData.createAccess")} />
 <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-card after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300" />
 </label>
 </div>
 );
}

interface CredentialsCardProps {
 form: UseFormReturn<OnboardingFormValues>;
 roles: CatalogItem[];
 accessErrors: any;
 showPassword: boolean;
 setShowPassword: (show: boolean) => void;
 currentPassword: string;
 handleCopyPassword: () => void;
 markManualEdit: (field: any) => void;
}

export function CredentialsCard({
 form,
 roles,
 accessErrors,
 showPassword,
 setShowPassword,
 currentPassword,
 handleCopyPassword,
 markManualEdit,
}: CredentialsCardProps) {
 const { register, watch, setValue } = form;
 const currentRoleId = watch("accessData.roleId") ?? "";
 const currentRoleName = watch("accessData.role") ?? "";
 const selectedValue =
 roles?.find((r) => r.id === currentRoleId)?.id ??
 roles?.find((r) =>
 r.name.toLowerCase() === currentRoleName.toLowerCase() ||
 r.code?.toLowerCase() === currentRoleName.toLowerCase() ||
 r.id === currentRoleName
 )?.id ??
 "";
 const unknownRole =
 (currentRoleName || currentRoleId) && roles?.length > 0 && !selectedValue
 ? currentRoleName || currentRoleId
 : "";

 return (
 <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
 <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
 Credenciales de Acceso
 </h4>
 <div className="grid gap-4 md:grid-cols-2">
 {/* Rol */}
 <FieldFrame label="Rol del Sistema" error={accessErrors?.role?.message}>
 <Select
 value={selectedValue}
 onChange={(e) => {
 const chosen = roles?.find((r) => r.id === e.target.value);
 setValue("accessData.roleId", e.target.value, { shouldValidate: true });
 setValue("accessData.role", chosen?.code ?? chosen?.name ?? e.target.value, { shouldValidate: true });
 }}
 >
 <option value="">Selecciona rol...</option>
 {roles?.map((role) => (
 <option key={`role-${role.id}`} value={role.id}>
 {role.name}
 </option>
 ))}
 </Select>
 {unknownRole ? (
 <p className="mt-1 text-[11px] text-amber-600">
 Rol actual: <span className="font-semibold">{unknownRole}</span> — selecciona el equivalente de la lista.
 </p>
 ) : null}
 </FieldFrame>

 {/* Usuario */}
 <FieldFrame label="Nombre de Usuario" error={accessErrors?.username?.message}>
 <Input
 placeholder="Ej. juan.quispe"
 {...register("accessData.username")}
 onChange={(e) => {
 markManualEdit("username");
 void form.register("accessData.username").onChange(e);
 }}
 />
 </FieldFrame>

 {/* Correo */}
 <FieldFrame
 label="Correo Electrónico Corporativo"
 error={accessErrors?.corporateEmail?.message}
 >
 <Input
 type="email"
 placeholder="juan.quispe@fabryor.com.pe"
 {...register("accessData.corporateEmail")}
 onChange={(e) => {
 markManualEdit("corporateEmail");
 void form.register("accessData.corporateEmail").onChange(e);
 }}
 />
 </FieldFrame>

 {/* Contraseña temporal */}
 <div className="flex flex-col gap-1">
 <FieldFrame
 label="Contraseña Temporal"
 error={accessErrors?.temporaryPassword?.message}
 >
 <div className="relative flex items-center">
 <Input
 placeholder="Ej. TempPassword123!"
 type={showPassword ? "text" : "password"}
 className="pr-20"
 {...register("accessData.temporaryPassword")}
 onChange={(e) => {
 markManualEdit("temporaryPassword");
 void form.register("accessData.temporaryPassword").onChange(e);
 }}
 />
 <div className="absolute right-1 flex items-center gap-0.5">
 {currentPassword ? (
 <button
 type="button"
 onClick={handleCopyPassword}
 title="Copiar contraseña"
 className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
 >
 <Copy className="size-3.5" />
 </button>
 ) : null}
 <button
 type="button"
 onClick={() => setShowPassword(!showPassword)}
 title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
 className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
 >
 {showPassword
 ? <EyeOff className="size-3.5" />
 : <Eye className="size-3.5" />
 }
 </button>
 </div>
 </div>
 </FieldFrame>

 <PasswordStrength password={currentPassword} />
 </div>
 </div>
 </div>
 );
}

interface AlternativesCardProps {
 alternatives: string[];
 handleSelectAlternative: (alt: string) => void;
}

export function AlternativesCard({ alternatives, handleSelectAlternative }: AlternativesCardProps) {
 return (
 <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
 <span className="mb-3 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
 Nombres de usuario alternativos disponibles:
 </span>
 <div className="flex flex-wrap gap-2">
 {alternatives.map((alt) => (
 <button
 key={alt}
 type="button"
 onClick={() => handleSelectAlternative(alt)}
 className="rounded-xl border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-indigo-900 transition hover:border-indigo-600 hover:bg-indigo-600 hover:text-white cursor-pointer"
 >
 {alt}
 </button>
 ))}
 </div>
 </div>
 );
}

interface SecurityPoliciesCardProps {
 forcePasswordChange: boolean;
 register: any;
}

export function SecurityPoliciesCard({ forcePasswordChange, register }: SecurityPoliciesCardProps) {
 return (
 <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
 <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
 Políticas de Seguridad
 </h5>

 {forcePasswordChange ? (
 <div className="flex items-start gap-2.5 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-xs text-sky-800">
 <Info className="mt-0.5 size-4 shrink-0 text-sky-500" />
 <span>
 El trabajador deberá cambiar su contraseña obligatoriamente en el primer inicio de sesión.
 </span>
 </div>
 ) : null}

 <div className="grid gap-3 md:grid-cols-2">
 <label className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
 <input
 type="checkbox"
 readOnly
 checked
 className="size-4 cursor-not-allowed rounded border-slate-300 text-indigo-600 opacity-70"
 />
 <span className="text-muted-foreground">
 Forzar cambio de contraseña en primer inicio
 </span>
 </label>

 <label className="flex cursor-pointer items-center gap-3 text-sm text-muted-foreground font-medium">
 <input
 type="checkbox"
 className="size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
 {...register("accessData.sendCredentialsByEmail")}
 />
 <span>Enviar credenciales por correo electrónico</span>
 </label>
 </div>
 </div>
 );
}

export function AccessDataForm({ form, roles }: AccessDataFormProps) {
 const {
 register,
 watch,
 setValue,
 formState: { errors, dirtyFields },
 } = form;
 const accessErrors = errors.accessData;

 const [showPassword, setShowPassword] = useState(false);

 const createAccess = watch("accessData.createAccess");
 const companyId = watch("laborData.companyId");
 const firstName = watch("personalData.firstName");
 const paternalLastName = watch("personalData.paternalLastName");
 const maternalLastName = watch("personalData.maternalLastName");
 const currentPassword = watch("accessData.temporaryPassword") ?? "";
 const forcePasswordChange = watch("accessData.forcePasswordChange");

 const {
 suggestCredentials,
 markManualEdit,
 isSuggesting,
 hasGenerated,
 suggestionError,
 setSuggestionError,
 alternatives,
 } = useCredentialSuggestion(form);

 const canSuggest =
 Boolean(companyId?.trim()) &&
 Boolean(firstName?.trim()) &&
 Boolean(paternalLastName?.trim());

 const suggestDisabledReason = !canSuggest
 ? "Completa empresa, nombres y apellido paterno para generar credenciales automáticamente."
 : undefined;

 const handleSuggest = () => {
 const isPasswordDirty = !!(dirtyFields?.accessData as any)?.temporaryPassword;
 if (isPasswordDirty) {
 const confirmOverwrite = window.confirm(
 "La contraseña temporal ha sido editada manualmente. ¿Deseas sobrescribirla?"
 );
 if (!confirmOverwrite) return;
 }
 setSuggestionError(null);
 suggestCredentials(companyId, firstName, paternalLastName, maternalLastName, {
 force: true,
 });
 };

 const handleCopyPassword = () => {
 if (!currentPassword) return;
 navigator.clipboard.writeText(currentPassword).then(
 () => toast.success("Contraseña temporal copiada."),
 () => toast.error("No se pudo copiar. Cópiala manualmente."),
 );
 };

 const handleSelectAlternative = (alt: string) => {
 markManualEdit("username");
 setValue("accessData.username", alt, { shouldValidate: true });
 const domain = watch("accessData.corporateEmail")?.split("@")[1] ?? "fabryor.com.pe";
 setValue("accessData.corporateEmail", `${alt}@${domain}`, { shouldValidate: true });
 };

 return (
 <div className="space-y-6">
 <AccessStatusCard register={register} />

 {createAccess ? (
 <div className="space-y-6 animate-fadeIn">
 {/* Generación Automática */}
 <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <div>
 <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
 {hasGenerated ? "Credenciales generadas" : "Generación automática"}
 </span>
 <p className="text-xs text-muted-foreground mt-1">
 {suggestDisabledReason
 ? suggestDisabledReason
 : "Sugiere correo, usuario y contraseña temporal con los datos del trabajador."}
 </p>
 </div>

 <Button
 type="button"
 onClick={handleSuggest}
 disabled={isSuggesting || !canSuggest}
 title={suggestDisabledReason}
 className="h-10 shrink-0 gap-1.5 rounded-xl px-4 text-xs font-semibold"
 >
 {isSuggesting
 ? <Loader2 className="size-4 animate-spin" />
 : hasGenerated
 ? <RefreshCw className="size-4" />
 : <Sparkles className="size-4" />
 }
 {isSuggesting
 ? "Generando..."
 : hasGenerated
 ? "Regenerar credenciales"
 : "Generar credenciales"}
 </Button>
 </div>

 {suggestionError ? (
 <div className="flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 p-3.5 text-xs text-rose-700 animate-fadeIn">
 <AlertCircle className="size-4 shrink-0" />
 <span>{suggestionError}</span>
 </div>
 ) : null}

 <CredentialsCard
 form={form}
 roles={roles}
 accessErrors={accessErrors}
 showPassword={showPassword}
 setShowPassword={setShowPassword}
 currentPassword={currentPassword}
 handleCopyPassword={handleCopyPassword}
 markManualEdit={markManualEdit}
 />

 {alternatives.length ? (
 <AlternativesCard
 alternatives={alternatives}
 handleSelectAlternative={handleSelectAlternative}
 />
 ) : null}

 <SecurityPoliciesCard
 forcePasswordChange={forcePasswordChange}
 register={register}
 />
 </div>
 ) : null}
 </div>
 );
}
