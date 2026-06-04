"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, X, Info, MapPin } from "lucide-react";
import dynamic from "next/dynamic";

import { organizationService } from "@/services/organization.service";
import type { OrganizationWorkLocation } from "@/services/organization.service";
import { FieldFrame } from "@/components/ui/fields";
import type { PlaceSuggestion } from "@/components/maps/PlaceSearchInput";

// ── Dynamic imports (no SSR) ──────────────────────────────────────────────────

const LocationPickerMap = dynamic(
  () => import("@/components/maps/LocationPickerMap").then((m) => m.LocationPickerMap),
  { ssr: false }
);

const PlaceSearchInput = dynamic(
  () => import("@/components/maps/PlaceSearchInput").then((m) => m.PlaceSearchInput),
  { ssr: false }
);

// ── Zod schema ────────────────────────────────────────────────────────────────

const schema = z
  .object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    description: z.string().optional().nullable(),
    address: z.string().min(3, "La dirección debe tener al menos 3 caracteres"),
    geographyDepartmentId: z.string().min(1, "Selecciona un departamento"),
    geographyProvinceId: z.string().min(1, "Selecciona una provincia"),
    geographyDistrictId: z.string().min(1, "Selecciona un distrito"),
    latitude: z
      .union([z.number(), z.string(), z.null()])
      .optional()
      .transform((v) => (v === "" || v == null ? null : Number(v)))
      .refine((v) => v === null || (v >= -90 && v <= 90), { message: "Debe estar entre -90 y 90" }),
    longitude: z
      .union([z.number(), z.string(), z.null()])
      .optional()
      .transform((v) => (v === "" || v == null ? null : Number(v)))
      .refine((v) => v === null || (v >= -180 && v <= 180), {
        message: "Debe estar entre -180 y 180",
      }),
    allowedRadiusMeters: z
      .union([z.number(), z.string(), z.null()])
      .optional()
      .transform((v) => (v === "" || v == null ? 100 : Number(v)))
      .refine((v) => v >= 1 && v <= 10000, { message: "Debe estar entre 1 y 10 000" }),
    isActive: z.boolean().default(true),
    sedeId: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.latitude != null && data.longitude == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La longitud es requerida si se provee latitud",
        path: ["longitude"],
      });
    }
    if (data.longitude != null && data.latitude == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La latitud es requerida si se provee longitud",
        path: ["latitude"],
      });
    }
  });

type FormData = z.infer<typeof schema>;

const EMPTY_DEFAULTS: FormData = {
  name: "",
  description: "",
  address: "",
  geographyDepartmentId: "",
  geographyProvinceId: "",
  geographyDistrictId: "",
  latitude: null,
  longitude: null,
  allowedRadiusMeters: 100,
  isActive: true,
  sedeId: null,
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface WorkLocationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationData?: OrganizationWorkLocation | null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function WorkLocationFormModal({
  isOpen,
  onClose,
  locationData,
}: WorkLocationFormModalProps) {
  const isEditing = !!locationData;
  const queryClient = useQueryClient();

  const [globalError, setGlobalError] = useState<{ message: string; details?: unknown } | null>(
    null
  );
  const [isReverseLoading, setIsReverseLoading] = useState(false);

  // Abort controller for reverse geocoding
  const reverseAbortRef = useRef<AbortController | null>(null);
  const reverseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Form defaults ─────────────────────────────────────────────────────────

  const formValues = useMemo<FormData>(() => {
    if (locationData) {
      return {
        name: locationData.name,
        description: (locationData as any).description ?? "",
        address: locationData.address ?? "",
        geographyDepartmentId: locationData.geographic_department_id ?? "",
        geographyProvinceId: locationData.geographic_province_id ?? "",
        geographyDistrictId: locationData.geographic_district_id ?? "",
        latitude: locationData.latitude ?? null,
        longitude: locationData.longitude ?? null,
        allowedRadiusMeters: locationData.allowed_radius_meters ?? 100,
        isActive: locationData.is_active !== false,
        sedeId: locationData.sede_id ?? null,
      };
    }
    return EMPTY_DEFAULTS;
  }, [locationData]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors, isDirty, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema as any),
    values: formValues as any,
    mode: "onChange",
  });

  const watchDept = watch("geographyDepartmentId");
  const watchProv = watch("geographyProvinceId");
  const watchLat  = watch("latitude");
  const watchLng  = watch("longitude");
  const watchRadius = watch("allowedRadiusMeters");

  // Reset on open
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setGlobalError(null);
      if (!locationData) reset(EMPTY_DEFAULTS as any);
    }
  }

  // ── Ubigeo queries ────────────────────────────────────────────────────────

  const { data: ubigeoDepts, isLoading: loadDepts } = useQuery({
    queryKey: ["ubigeo", "departments"],
    queryFn: async () => {
      const res = await fetch("/api/ubigeo/departments");
      const json = await res.json();
      return (json.data ?? []) as Array<{ id: string; name: string }>;
    },
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  const { data: ubigeoProvs, isLoading: loadProvs } = useQuery({
    queryKey: ["ubigeo", "provinces", watchDept],
    queryFn: async () => {
      const res = await fetch(`/api/ubigeo/provinces/${watchDept}`);
      const json = await res.json();
      return (json.data ?? []) as Array<{ id: string; name: string }>;
    },
    enabled: !!watchDept && isOpen,
  });

  const { data: ubigeoDists, isLoading: loadDists } = useQuery({
    queryKey: ["ubigeo", "districts", watchProv],
    queryFn: async () => {
      const res = await fetch(`/api/ubigeo/districts/${watchProv}`);
      const json = await res.json();
      return (json.data ?? []) as Array<{ id: string; name: string }>;
    },
    enabled: !!watchProv && isOpen,
  });

  // ── Ubigeo auto-fill ──────────────────────────────────────────────────────

  const applyUbigeoFromPlace = useCallback(
    (place: PlaceSuggestion) => {
      const deptId = place.geographic_department_id || place.department_id || null;
      const provId  = place.geographic_province_id  || place.province_id  || null;
      const distId  = place.geographic_district_id  || place.district_id  || null;

      if (deptId) {
        setValue("geographyDepartmentId", deptId, { shouldDirty: true });
        setValue("geographyProvinceId", "", { shouldDirty: true });
        setValue("geographyDistrictId", "", { shouldDirty: true });
      }
      // Staggered to allow react-query to refetch after dept change
      if (provId) {
        setTimeout(() => {
          setValue("geographyProvinceId", provId, { shouldDirty: true });
          setValue("geographyDistrictId", "", { shouldDirty: true });
        }, 120);
      }
      if (distId) {
        setTimeout(() => {
          setValue("geographyDistrictId", distId, { shouldDirty: true });
        }, 250);
      }
    },
    [setValue]
  );

  // ── Place selection handler ───────────────────────────────────────────────

  const handlePlaceSelect = useCallback(
    (place: PlaceSuggestion) => {
      const lat = Number(place.latitude);
      const lng = Number(place.longitude);

      // name — only if currently empty
      const currentName = getValues("name");
      if (!currentName && (place.name || place.display_name)) {
        setValue("name", (place.name || place.display_name)!, { shouldDirty: true });
      }

      // address — prefer address field, fall back to first two segments of display_name
      const addr =
        place.address ||
        (place.display_name
          ? place.display_name.split(",").slice(0, 3).join(",").trim()
          : null);
      if (addr) setValue("address", addr, { shouldDirty: true });

      // coordinates
      if (!isNaN(lat)) setValue("latitude", lat, { shouldValidate: true, shouldDirty: true });
      if (!isNaN(lng)) setValue("longitude", lng, { shouldValidate: true, shouldDirty: true });

      // ubigeo
      applyUbigeoFromPlace(place);
    },
    [getValues, setValue, applyUbigeoFromPlace]
  );

  // ── Reverse geocoding ─────────────────────────────────────────────────────

  const doReverseGeocode = useCallback(
    (lat: number, lng: number) => {
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return;

      // Cancel previous
      if (reverseAbortRef.current) reverseAbortRef.current.abort();
      const controller = new AbortController();
      reverseAbortRef.current = controller;

      setIsReverseLoading(true);

      fetch(`/api/work-locations/places/reverse?latitude=${lat}&longitude=${lng}`, {
        signal: controller.signal,
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data) return;
          const place: PlaceSuggestion = data?.data ?? data;
          if (!place) return;
          if (place.address) setValue("address", place.address, { shouldDirty: true });
          // name — only if empty
          if (!getValues("name") && (place.name || place.display_name)) {
            setValue("name", (place.name || place.display_name)!, { shouldDirty: true });
          }
          applyUbigeoFromPlace(place);
        })
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          // Silently ignore — user can fill manually
        })
        .finally(() => setIsReverseLoading(false));
    },
    [setValue, getValues, applyUbigeoFromPlace]
  );

  // ── Trigger reverse geocode on coordinate changes ─────────────────────────

  const latNum = watchLat != null && String(watchLat) !== "" ? Number(watchLat) : null;
  const lngNum = watchLng != null && String(watchLng) !== "" ? Number(watchLng) : null;

  const prevCoordsRef = useRef<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });

  useEffect(() => {
    if (!isOpen) return;
    if (latNum === null || lngNum === null) return;
    if (isNaN(latNum) || isNaN(lngNum)) return;
    if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) return;

    // Skip if coords haven't changed
    const prev = prevCoordsRef.current;
    if (latNum === prev.lat && lngNum === prev.lng) return;
    prevCoordsRef.current = { lat: latNum, lng: lngNum };

    if (reverseTimerRef.current) clearTimeout(reverseTimerRef.current);
    reverseTimerRef.current = setTimeout(() => doReverseGeocode(latNum, lngNum), 500);

    return () => {
      if (reverseTimerRef.current) clearTimeout(reverseTimerRef.current);
    };
  }, [latNum, lngNum, isOpen, doReverseGeocode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      reverseAbortRef.current?.abort();
      if (reverseTimerRef.current) clearTimeout(reverseTimerRef.current);
    };
  }, []);

  // ── Map interaction ───────────────────────────────────────────────────────

  const handleMapLocationChange = useCallback(
    (loc: { latitude: number; longitude: number }) => {
      setValue("latitude", loc.latitude, { shouldValidate: true, shouldDirty: true });
      setValue("longitude", loc.longitude, { shouldValidate: true, shouldDirty: true });
    },
    [setValue]
  );

  // ── Mutation ──────────────────────────────────────────────────────────────

  const mutation = useMutation({
    mutationFn: (values: FormData) => {
      setGlobalError(null);
      const payload = {
        name: values.name,
        description: values.description || null,
        address: values.address,
        geographyDepartmentId: values.geographyDepartmentId,
        geographyProvinceId: values.geographyProvinceId,
        geographyDistrictId: values.geographyDistrictId,
        latitude: values.latitude ?? null,
        longitude: values.longitude ?? null,
        allowedRadiusMeters: values.allowedRadiusMeters ?? 100,
        isActive: values.isActive,
        sedeId: values.sedeId || null,
      };
      return isEditing && locationData
        ? organizationService.updateWorkLocation(locationData.id, payload)
        : organizationService.createWorkLocation(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-locations"] });
      onClose();
    },
    onError: (error: any) => {
      const status  = error?.status;
      const details = error?.details;
      const code    = details?.error_code || details?.code || error?.code;

      if (status === 409 || code === "WORK_LOCATION_ALREADY_EXISTS") {
        setGlobalError({ message: "Ya existe un lugar de trabajo con ese nombre.", details });
      } else if (status === 422 && details?.errors?.length) {
        setGlobalError({ message: "Por favor, revisa los errores en el formulario.", details });
      } else {
        setGlobalError({
          message: error?.message ?? "No se pudo guardar el lugar de trabajo. Intenta nuevamente.",
          details,
        });
      }
    },
  });

  // ── Derived display values ────────────────────────────────────────────────

  if (!isOpen) return null;

  const currentLat    = latNum !== null && !isNaN(latNum) ? latNum : null;
  const currentLng    = lngNum !== null && !isNaN(lngNum) ? lngNum : null;
  const currentRadius = watchRadius ? Number(watchRadius) : 100;

  // Save button: form must be dirty AND all required fields must have values
  const watchName   = watch("name");
  const watchAddr   = watch("address");
  const watchDist   = watch("geographyDistrictId");
  const allRequired =
    watchName.trim().length >= 2 &&
    watchAddr.trim().length >= 3 &&
    !!watchDept &&
    !!watchProv &&
    !!watchDist &&
    currentLat !== null &&
    currentLng !== null &&
    currentRadius >= 1;

  const canSave = isDirty && allRequired && !mutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="flex w-full max-w-2xl max-h-[92vh] flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <MapPin className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? "Editar Lugar de Trabajo" : "Nuevo Lugar de Trabajo"}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? "Modifica los detalles de la sede o ubicación."
                  : "Registra una nueva sede, obra o punto de trabajo."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="overflow-y-auto flex-1 p-6">
          <form
            id="work-location-form"
            onSubmit={handleSubmit((v) => mutation.mutate(v as any))}
            className="space-y-5"
          >

            {/* ①  Buscador de lugar */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Buscar lugar
                <span className="ml-1.5 font-normal text-slate-400">(autocompletado en tiempo real)</span>
              </label>
              <PlaceSearchInput disabled={mutation.isPending} onSelect={handlePlaceSelect} />
              <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-400">
                <Info className="size-3 shrink-0" />
                Escribe desde 3 caracteres. Al seleccionar se rellenan nombre, dirección, ubigeo y coordenadas.
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden>
                <div className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-slate-400">o completa manualmente</span>
              </div>
            </div>

            {/* ②  Nombre */}
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <FieldFrame label="Nombre de la Sede / Obra *" error={errors.name?.message}>
                  <input
                    {...field}
                    disabled={mutation.isPending}
                    className="form-input"
                    placeholder="Ej: Sede Principal Lima"
                    autoComplete="off"
                  />
                </FieldFrame>
              )}
            />

            {/* ③  Descripción (opcional) */}
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <FieldFrame label="Descripción" hint="Opcional">
                  <input
                    {...field}
                    value={field.value ?? ""}
                    disabled={mutation.isPending}
                    className="form-input"
                    placeholder="Ej: Oficinas administrativas, turno mañana"
                  />
                </FieldFrame>
              )}
            />

            {/* ④  Ubigeo */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Controller
                name="geographyDepartmentId"
                control={control}
                render={({ field }) => (
                  <FieldFrame label="Departamento *" error={errors.geographyDepartmentId?.message}>
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
                      {ubigeoDepts?.map((d) => (
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
                  <FieldFrame label="Provincia *" error={errors.geographyProvinceId?.message}>
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
                      {ubigeoProvs?.map((p) => (
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
                  <FieldFrame label="Distrito *" error={errors.geographyDistrictId?.message}>
                    <select
                      {...field}
                      disabled={mutation.isPending || !watchProv || loadDists}
                      className="form-select"
                    >
                      <option value="">Seleccione...</option>
                      {ubigeoDists?.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </FieldFrame>
                )}
              />
            </div>

            {/* ⑤  Dirección */}
            <Controller
              name="address"
              control={control}
              render={({ field }) => (
                <FieldFrame label="Dirección Completa *" error={errors.address?.message}>
                  <textarea
                    {...field}
                    disabled={mutation.isPending}
                    className="form-textarea"
                    rows={2}
                    placeholder="Ej: Av. Principal 123, Piso 2"
                  />
                </FieldFrame>
              )}
            />

            {/* ⑥  Coordenadas + Radio */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Controller
                name="latitude"
                control={control}
                render={({ field }) => (
                  <FieldFrame
                    label="Latitud *"
                    hint="Entre -90 y 90"
                    error={errors.latitude?.message as string}
                  >
                    <input
                      {...field}
                      value={field.value ?? ""}
                      disabled={mutation.isPending}
                      type="number"
                      step="any"
                      className="form-input"
                      placeholder="-12.04318"
                    />
                  </FieldFrame>
                )}
              />
              <Controller
                name="longitude"
                control={control}
                render={({ field }) => (
                  <FieldFrame
                    label="Longitud *"
                    hint="Entre -180 y 180"
                    error={errors.longitude?.message as string}
                  >
                    <input
                      {...field}
                      value={field.value ?? ""}
                      disabled={mutation.isPending}
                      type="number"
                      step="any"
                      className="form-input"
                      placeholder="-77.02824"
                    />
                  </FieldFrame>
                )}
              />
              <Controller
                name="allowedRadiusMeters"
                control={control}
                render={({ field }) => (
                  <FieldFrame
                    label="Radio GPS (m) *"
                    hint="Radio de asistencia móvil (1–10 000)"
                    error={errors.allowedRadiusMeters?.message as string}
                  >
                    <input
                      {...field}
                      disabled={mutation.isPending}
                      type="number"
                      min={1}
                      max={10000}
                      className="form-input"
                      placeholder="100"
                    />
                  </FieldFrame>
                )}
              />
            </div>

            {/* Reverse geocode indicator */}
            {isReverseLoading && (
              <p className="flex items-center gap-1.5 text-xs text-indigo-500">
                <span className="inline-block size-3 animate-spin rounded-full border-2 border-indigo-300 border-t-indigo-600" />
                Obteniendo dirección desde coordenadas...
              </p>
            )}

            {/* ⑦  Mapa interactivo */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Mapa interactivo
                <span className="ml-1.5 font-normal text-slate-400">— haz clic o arrastra el pin</span>
              </label>
              <LocationPickerMap
                latitude={currentLat}
                longitude={currentLng}
                radius={currentRadius}
                onLocationChange={handleMapLocationChange}
                disabled={mutation.isPending}
              />
            </div>

            {/* ⑧  Estado activo */}
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="wl-is-active"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    disabled={mutation.isPending}
                    className="rounded border-slate-300 text-brand focus:ring-brand"
                  />
                  <label htmlFor="wl-is-active" className="text-sm font-medium text-slate-700">
                    Lugar de trabajo activo
                  </label>
                </div>
              )}
            />

            {/* ⑨  Error global */}
            {globalError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                <div className="flex items-center gap-2 text-rose-800">
                  <AlertCircle className="size-5 shrink-0" />
                  <h4 className="text-sm font-semibold">Error al guardar</h4>
                </div>
                <p className="ml-7 mt-1 text-sm text-rose-700">{globalError.message}</p>
                {Boolean(globalError.details) && (
                  <pre className="ml-7 mt-3 overflow-x-auto rounded-lg bg-rose-900/10 p-3 text-xs text-rose-900">
                    {JSON.stringify(globalError.details, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </form>
        </div>

        {/* ── Footer ── */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          {/* Required fields hint */}
          <p className="text-xs text-slate-400">
            <span className="text-rose-400">*</span> Campos obligatorios
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              form="work-location-form"
              type="submit"
              disabled={!canSave}
              title={
                !allRequired
                  ? "Completa nombre, dirección, ubigeo, coordenadas y radio antes de guardar"
                  : undefined
              }
              className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:pointer-events-none disabled:opacity-50"
            >
              {mutation.isPending ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  Guardando...
                </>
              ) : isEditing ? (
                "Guardar Cambios"
              ) : (
                "Crear Lugar"
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
