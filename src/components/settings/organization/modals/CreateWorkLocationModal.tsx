"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, X } from "lucide-react";
import { FieldFrame } from "@/components/ui/fields";
import { organizationService } from "@/services/organization.service";
import dynamic from "next/dynamic";

const LocationPickerMap = dynamic(
  () => import("@/components/maps/LocationPickerMap").then((mod) => mod.LocationPickerMap),
  { ssr: false }
);

const schema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  address: z.string().min(3, "La dirección debe tener al menos 3 caracteres"),
  geographyDepartmentId: z.string().min(1, "Selecciona un departamento"),
  geographyProvinceId: z.string().min(1, "Selecciona una provincia"),
  geographyDistrictId: z.string().min(1, "Selecciona un distrito"),
  latitude: z.union([z.number(), z.string(), z.null()]).optional()
    .transform(val => val === "" || val == null ? null : Number(val))
    .refine(val => val === null || (val >= -90 && val <= 90), { message: "Debe estar entre -90 y 90" }),
  longitude: z.union([z.number(), z.string(), z.null()]).optional()
    .transform(val => val === "" || val == null ? null : Number(val))
    .refine(val => val === null || (val >= -180 && val <= 180), { message: "Debe estar entre -180 y 180" }),
  allowedRadiusMeters: z.union([z.number(), z.string(), z.null()]).optional()
    .transform(val => val === "" || val == null ? 100 : Number(val))
    .refine(val => val >= 1 && val <= 10000, { message: "Debe estar entre 1 y 10000" }),
  isActive: z.boolean().default(true),
}).superRefine((data, ctx) => {
  if (data.latitude != null && data.longitude == null) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La longitud es requerida si se provee latitud", path: ["longitude"] });
  }
  if (data.longitude != null && data.latitude == null) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La latitud es requerida si se provee longitud", path: ["latitude"] });
  }
});

type FormData = z.infer<typeof schema>;

interface CreateWorkLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateWorkLocationModal({ isOpen, onClose }: CreateWorkLocationModalProps) {
  const queryClient = useQueryClient();
  const [globalError, setGlobalError] = useState<{ message: string; details?: unknown } | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema as any),
    defaultValues: { name: "", address: "", geographyDepartmentId: "", geographyProvinceId: "", geographyDistrictId: "", latitude: "", longitude: "", allowedRadiusMeters: 100, isActive: true } as any,
  });

  const watchDept = watch("geographyDepartmentId");
  const watchProv = watch("geographyProvinceId");

  const { data: ubigeoDepts, isLoading: loadDepts } = useQuery({
    queryKey: ["ubigeo", "departments"],
    queryFn: async () => {
      const res = await fetch("/api/ubigeo/departments");
      const json = await res.json();
      return json.data || [];
    },
    enabled: isOpen,
  });

  const { data: ubigeoProvs, isLoading: loadProvs } = useQuery({
    queryKey: ["ubigeo", "provinces", watchDept],
    queryFn: async () => {
      const res = await fetch(`/api/ubigeo/provinces/${watchDept}`);
      const json = await res.json();
      return json.data || [];
    },
    enabled: !!watchDept && isOpen,
  });

  const { data: ubigeoDists, isLoading: loadDists } = useQuery({
    queryKey: ["ubigeo", "districts", watchProv],
    queryFn: async () => {
      const res = await fetch(`/api/ubigeo/districts/${watchProv}`);
      const json = await res.json();
      return json.data || [];
    },
    enabled: !!watchProv && isOpen,
  });

  useEffect(() => {
    if (isOpen) {
      reset({ name: "", address: "", geographyDepartmentId: "", geographyProvinceId: "", geographyDistrictId: "", latitude: "", longitude: "", allowedRadiusMeters: 100, isActive: true } as any);
      setGlobalError(null);
    }
  }, [isOpen, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormData) => organizationService.createWorkLocation(values as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      onClose();
    },
    onError: (error: any) => {
      setGlobalError({
        message: error?.message || "Ocurrió un error al crear el lugar de trabajo.",
        details: error?.details,
      });
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-2xl max-h-[90vh] flex-col rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 p-6 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Nuevo Lugar de Trabajo</h2>
            <p className="mt-1 text-sm text-slate-500">Registra una nueva sede o ubicación para los trabajadores.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 transition">
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="location-form" onSubmit={handleSubmit((values) => mutation.mutate(values as any))} className="space-y-6">
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <FieldFrame label="Nombre de la Sede" error={errors.name?.message}>
                  <input {...field} disabled={mutation.isPending} className="form-input" placeholder="Ej: Sede Principal Lima" />
                </FieldFrame>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Controller
                name="geographyDepartmentId"
                control={control}
                render={({ field }) => (
                  <FieldFrame label="Departamento" error={errors.geographyDepartmentId?.message}>
                    <select
                      {...field}
                      disabled={mutation.isPending || loadDepts}
                      onChange={(e) => {
                        field.onChange(e);
                        setValue("geographyProvinceId", "");
                        setValue("geographyDistrictId", "");
                      }}
                      className="form-select"
                    >
                      <option value="">Seleccione...</option>
                      {ubigeoDepts?.map((d: any) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </FieldFrame>
                )}
              />

              <Controller
                name="geographyProvinceId"
                control={control}
                render={({ field }) => (
                  <FieldFrame label="Provincia" error={errors.geographyProvinceId?.message}>
                    <select
                      {...field}
                      disabled={mutation.isPending || !watchDept || loadProvs}
                      onChange={(e) => {
                        field.onChange(e);
                        setValue("geographyDistrictId", "");
                      }}
                      className="form-select"
                    >
                      <option value="">Seleccione...</option>
                      {ubigeoProvs?.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </FieldFrame>
                )}
              />

              <Controller
                name="geographyDistrictId"
                control={control}
                render={({ field }) => (
                  <FieldFrame label="Distrito" error={errors.geographyDistrictId?.message}>
                    <select
                      {...field}
                      disabled={mutation.isPending || !watchProv || loadDists}
                      className="form-select"
                    >
                      <option value="">Seleccione...</option>
                      {ubigeoDists?.map((d: any) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </FieldFrame>
                )}
              />
            </div>

            <Controller
              name="address"
              control={control}
              render={({ field }) => (
                <FieldFrame label="Dirección Completa" error={errors.address?.message}>
                  <textarea {...field} disabled={mutation.isPending} className="form-textarea" rows={2} placeholder="Ej: Av. Principal 123..." />
                </FieldFrame>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Controller
                name="latitude"
                control={control}
                render={({ field }) => (
                  <FieldFrame label="Latitud (Opcional)" error={errors.latitude?.message as string}>
                    <input {...field} value={field.value ?? ""} disabled={mutation.isPending} type="number" step="any" className="form-input" placeholder="-12.04318" />
                  </FieldFrame>
                )}
              />
              <Controller
                name="longitude"
                control={control}
                render={({ field }) => (
                  <FieldFrame label="Longitud (Opcional)" error={errors.longitude?.message as string}>
                    <input {...field} value={field.value ?? ""} disabled={mutation.isPending} type="number" step="any" className="form-input" placeholder="-77.02824" />
                  </FieldFrame>
                )}
              />
              <Controller
                name="allowedRadiusMeters"
                control={control}
                render={({ field }) => (
                  <FieldFrame label="Radio (m)" error={errors.allowedRadiusMeters?.message as string}>
                    <input {...field} disabled={mutation.isPending} type="number" className="form-input" placeholder="100" />
                  </FieldFrame>
                )}
              />
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-slate-700">Seleccionar ubicación en el Mapa</label>
              <LocationPickerMap
                latitude={watch("latitude") ? Number(watch("latitude")) : null}
                longitude={watch("longitude") ? Number(watch("longitude")) : null}
                radius={watch("allowedRadiusMeters") ? Number(watch("allowedRadiusMeters")) : 100}
                onLocationChange={(loc) => {
                  setValue("latitude", loc.latitude, { shouldValidate: true, shouldDirty: true });
                  setValue("longitude", loc.longitude, { shouldValidate: true, shouldDirty: true });
                }}
                disabled={mutation.isPending}
              />
              {(errors.latitude || errors.longitude) && (
                <p className="mt-1 text-sm text-rose-500">
                  Debe seleccionar una ubicación en el mapa.
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    disabled={mutation.isPending}
                    className="size-4 rounded border-slate-300 text-brand focus:ring-brand"
                  />
                )}
              />
              <label className="text-sm text-slate-700">Lugar de trabajo activo</label>
            </div>

            {globalError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                <div className="flex items-center gap-2 text-rose-800">
                  <AlertCircle className="size-5 shrink-0" />
                  <h4 className="text-sm font-semibold">No se pudo crear</h4>
                </div>
                <p className="mt-1 text-sm text-rose-700 ml-7">{globalError.message}</p>
                {Boolean(globalError.details) && (
                  <pre className="mt-2 overflow-x-auto rounded bg-rose-900/10 p-2 text-xs text-rose-900 ml-7">
                    {JSON.stringify(globalError.details, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </form>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 p-6 bg-slate-50/50">
          <button type="button" onClick={onClose} disabled={mutation.isPending} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100">
            Cancelar
          </button>
          <button form="location-form" type="submit" disabled={!isDirty || mutation.isPending} className="flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-hover disabled:pointer-events-none disabled:opacity-50">
            {mutation.isPending ? "Guardando..." : "Crear Lugar"}
          </button>
        </div>
      </div>
    </div>
  );
}
