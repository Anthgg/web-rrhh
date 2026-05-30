"use client";

import type { UseFormReturn } from "react-hook-form";
import { AlertCircle, Loader2, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldFrame, Input, Select } from "@/components/ui/fields";
import { useCredentialSuggestion } from "../hooks/useCredentialSuggestion";
import type { OnboardingFormValues } from "../schemas/onboarding.schema";
import type { CatalogItem } from "../types/onboarding.types";

const onboardingAccessRoles = [
  { value: "TRABAJADOR", label: "Trabajador" },
] as const;

interface AccessDataFormProps {
  form: UseFormReturn<OnboardingFormValues>;
  roles: CatalogItem[];
}

export function AccessDataForm({ form, roles }: AccessDataFormProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;
  const accessErrors = errors.accessData;

  const createAccess = watch("accessData.createAccess");
  const companyId = watch("laborData.companyId");
  const firstName = watch("personalData.firstName");
  const paternalLastName = watch("personalData.paternalLastName");
  const maternalLastName = watch("personalData.maternalLastName");

  const {
    suggestCredentials,
    isSuggesting,
    error: suggestionError,
    alternatives,
    setError: setSuggestionError,
  } = useCredentialSuggestion(setValue);

  const handleSuggest = async () => {
    setSuggestionError(null);
    await suggestCredentials(companyId, firstName, paternalLastName, maternalLastName);
  };

  const handleSelectAlternative = (alt: string) => {
    setValue("accessData.username", alt, { shouldValidate: true });
    const domain = watch("accessData.corporateEmail")?.split("@")[1] || "fabryor.com.pe";
    setValue("accessData.corporateEmail", `${alt}@${domain}`, { shouldValidate: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50/20 p-4">
        <div className="flex items-center gap-3">
          <Lock className="size-5 flex-shrink-0 text-indigo-600" />
          <div>
            <h4 className="text-sm font-semibold text-indigo-900">Crear usuario de acceso al sistema</h4>
            <p className="text-xs text-indigo-700/80">
              Activa esta opcion para generar usuario, contrasena temporal y rol del sistema.
            </p>
          </div>
        </div>
        <label className="relative inline-flex cursor-pointer items-center">
          <input type="checkbox" className="peer sr-only" {...register("accessData.createAccess")} />
          <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300" />
        </label>
      </div>

      {createAccess ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4">
            <div>
              <span className="text-xs font-semibold text-slate-700">Generacion automatica</span>
              <p className="text-[11px] text-slate-500">
                Sugiere correo, usuario y contrasena temporal con los datos del trabajador.
              </p>
            </div>
            <Button
              type="button"
              onClick={handleSuggest}
              disabled={isSuggesting}
              className="h-9 gap-1.5 rounded-lg px-3 text-xs"
            >
              {isSuggesting ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3.5" />}
              {isSuggesting ? "Generando..." : "Sugerir Credenciales"}
            </Button>
          </div>

          {suggestionError ? (
            <div className="flex items-center gap-2 rounded-lg border border-rose-100 bg-rose-50 p-2.5 text-xs text-rose-600">
              <AlertCircle className="size-4 flex-shrink-0" />
              <span>{suggestionError}</span>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <FieldFrame label="Rol del Sistema" error={accessErrors?.role?.message}>
              <Select {...register("accessData.role")}>
                <option value="">Selecciona rol...</option>
                {roles?.map((role) => (
                  <option key={`role-${role.id}`} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </Select>
            </FieldFrame>

            <FieldFrame label="Nombre de Usuario" error={accessErrors?.username?.message}>
              <Input placeholder="Ej. juan.quispe" {...register("accessData.username")} />
            </FieldFrame>

            <FieldFrame label="Correo Electronico Corporativo" error={accessErrors?.corporateEmail?.message}>
              <Input type="email" placeholder="juan.quispe@fabryor.com.pe" {...register("accessData.corporateEmail")} />
            </FieldFrame>

            <FieldFrame
              label="Contrasena Temporal"
              error={accessErrors?.temporaryPassword?.message}
              hint="Min. 8 caracteres, mayuscula, minuscula, numero y simbolo."
            >
              <Input placeholder="Ej. TempPassword123!" {...register("accessData.temporaryPassword")} />
            </FieldFrame>
          </div>

          {alternatives?.length ? (
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
              <span className="mb-2 block text-xs font-semibold text-slate-600">
                Nombres de usuario alternativos disponibles:
              </span>
              <div className="flex flex-wrap gap-2">
                {alternatives.map((alt) => (
                  <button
                    key={alt}
                    type="button"
                    onClick={() => handleSelectAlternative(alt)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium transition hover:border-indigo-500 hover:text-indigo-600"
                  >
                    {alt}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-3">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-700">Politicas de Seguridad</h5>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  {...register("accessData.forcePasswordChange")}
                />
                <span>Forzar cambio de contrasena en primer inicio</span>
              </label>

              <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  {...register("accessData.sendCredentialsByEmail")}
                />
                <span>Enviar credenciales por correo electronico</span>
              </label>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
