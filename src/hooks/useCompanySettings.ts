"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  createCompanySettingsFormData,
  getCompanySettings,
  updateCompanySettings,
} from "@/services/companySettingsService";
import type { CompanyAssetType, CompanySettings, CompanySettingsPayload } from "@/types";

export type CompanySettingsFormErrors = Partial<Record<keyof CompanySettingsPayload, string>>;

interface FetchSettingsOptions {
  showLoader?: boolean;
  suppressError?: boolean;
  syncForm?: boolean;
}

const RUC_REGEX = /^\d{11}$/;
const HEX_REGEX = /^#([0-9A-F]{6})$/i;
const PHONE_REGEX = /^[+]?[\d\s().-]{7,20}$/;

function normalizeComparableForm(payload: CompanySettingsPayload) {
  return {
    razon_social: payload.razon_social.trim(),
    nombre_comercial: payload.nombre_comercial.trim(),
    ruc: payload.ruc.replace(/\D/g, ""),
    direccion_fiscal: payload.direccion_fiscal.trim(),
    telefono: payload.telefono.trim(),
    correo_corporativo: payload.correo_corporativo.trim().toLowerCase(),
    pagina_web: payload.pagina_web.trim(),
    representante_legal: payload.representante_legal.trim(),
    color_primario: payload.color_primario.trim().toUpperCase(),
    color_secundario: payload.color_secundario.trim().toUpperCase(),
    color_texto: payload.color_texto.trim().toUpperCase(),
  };
}

function isOptionalEmailValid(value: string) {
  if (!value.trim()) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isOptionalUrlValid(value: string) {
  if (!value.trim()) return true;

  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isOptionalPhoneValid(value: string) {
  if (!value.trim()) return true;
  const normalized = value.trim();
  const digits = normalized.replace(/\D/g, "");
  return PHONE_REGEX.test(normalized) && digits.length >= 6;
}

export function validateCompanySettingsForm(payload: CompanySettingsPayload) {
  const errors: CompanySettingsFormErrors = {};
  const normalizedRuc = payload.ruc.replace(/\D/g, "");

  if (payload.razon_social.trim().length < 3) {
    errors.razon_social = "Ingresa una razon social valida.";
  }

  if (!RUC_REGEX.test(normalizedRuc)) {
    errors.ruc = "El RUC debe tener exactamente 11 digitos.";
  }

  if (!isOptionalPhoneValid(payload.telefono)) {
    errors.telefono = "Ingresa un telefono valido.";
  }

  if (!isOptionalEmailValid(payload.correo_corporativo)) {
    errors.correo_corporativo = "Ingresa un correo corporativo valido.";
  }

  if (!isOptionalUrlValid(payload.pagina_web)) {
    errors.pagina_web = "Ingresa una URL valida con http o https.";
  }

  if (!HEX_REGEX.test(payload.color_primario.trim())) {
    errors.color_primario = "Usa un color HEX valido. Ejemplo: #1E3A8A.";
  }

  if (!HEX_REGEX.test(payload.color_secundario.trim())) {
    errors.color_secundario = "Usa un color HEX valido. Ejemplo: #64748B.";
  }

  if (!HEX_REGEX.test(payload.color_texto.trim())) {
    errors.color_texto = "Usa un color HEX valido. Ejemplo: #0F172A.";
  }

  return {
    errors,
    hasBlockingErrors: Object.keys(errors).length > 0,
  };
}

function createLocalSettingsSnapshot(
  payload: CompanySettingsPayload,
  currentSettings: CompanySettings | null,
): CompanySettings {
  return {
    id: currentSettings?.id ?? "local-company-settings",
    razon_social: payload.razon_social.trim(),
    nombre_comercial: payload.nombre_comercial.trim() || null,
    ruc: payload.ruc.replace(/\D/g, ""),
    direccion_fiscal: payload.direccion_fiscal.trim() || null,
    telefono: payload.telefono.trim() || null,
    correo_corporativo: payload.correo_corporativo.trim() || null,
    pagina_web: payload.pagina_web.trim() || null,
    representante_legal: payload.representante_legal.trim() || null,
    color_primario: payload.color_primario.trim().toUpperCase(),
    color_secundario: payload.color_secundario.trim().toUpperCase(),
    color_texto: payload.color_texto.trim().toUpperCase(),
    logo_url: currentSettings?.logo_url ?? null,
    firma_url: currentSettings?.firma_url ?? null,
    sello_url: currentSettings?.sello_url ?? null,
    updated_at: new Date().toISOString(),
  };
}

function getPrimaryValidationMessage(payload: CompanySettingsPayload, errors: CompanySettingsFormErrors) {
  if (!payload.razon_social.trim() || !payload.ruc.replace(/\D/g, "")) {
    return "Completa la razon social y RUC antes de guardar.";
  }

  if (errors.ruc) return "El RUC debe tener exactamente 11 digitos.";

  return (
    errors.razon_social ||
    errors.telefono ||
    errors.correo_corporativo ||
    errors.pagina_web ||
    errors.color_primario ||
    errors.color_secundario ||
    errors.color_texto ||
    "No se pudo validar la configuracion."
  );
}

function getAssetField(assetType: CompanyAssetType) {
  if (assetType === "logo") return "logo_url";
  if (assetType === "signature") return "firma_url";
  return "sello_url";
}

export function useCompanySettings() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [formData, setFormData] = useState<CompanySettingsPayload>(() => createCompanySettingsFormData());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const validation = useMemo(() => validateCompanySettingsForm(formData), [formData]);
  const isConfigured = Boolean(settings?.id);
  const savedSnapshot = normalizeComparableForm(createCompanySettingsFormData(settings));
  const currentSnapshot = normalizeComparableForm(formData);
  const isDirty = JSON.stringify(savedSnapshot) !== JSON.stringify(currentSnapshot);
  const canSave = !isSaving && isDirty;

  const fetchSettings = useCallback(
    async ({ showLoader = true, suppressError = false, syncForm = true }: FetchSettingsOptions = {}) => {
      if (showLoader) setIsLoading(true);
      if (!suppressError) setError(null);

      try {
        const response = await getCompanySettings();
        setSettings(response.data);

        if (syncForm) {
          setFormData(createCompanySettingsFormData(response.data));
        }

        setHasLoaded(true);
        return response;
      } catch (requestError) {
        const message =
          requestError instanceof Error
            ? requestError.message
            : "No se pudo cargar la configuracion corporativa.";

        if (!suppressError) {
          setError(message);
        }

        return null;
      } finally {
        if (showLoader) setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchSettings();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchSettings]);

  useEffect(() => {
    if (!isDirty) return undefined;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  function updateField<K extends keyof CompanySettingsPayload>(
    name: K,
    value: CompanySettingsPayload[K],
  ) {
    setFormData((current) => ({
      ...current,
      [name]:
        typeof value === "string" &&
        (name === "color_primario" || name === "color_secundario" || name === "color_texto")
          ? value.toUpperCase()
          : value,
    }));
    setError(null);
  }

  function resetForm() {
    setFormData(createCompanySettingsFormData(settings));
    setError(null);
  }

  async function saveSettings() {
    const currentValidation = validateCompanySettingsForm(formData);

    if (currentValidation.hasBlockingErrors) {
      const message = getPrimaryValidationMessage(formData, currentValidation.errors);
      setError(message);
      toast.error(message);
      return false;
    }

    setIsSaving(true);
    setError(null);

    try {
      const isCreating = !isConfigured;
      const response = await updateCompanySettings(formData);
      const nextSettings = response.data ?? createLocalSettingsSnapshot(formData, settings);

      setSettings(nextSettings);
      setFormData(createCompanySettingsFormData(nextSettings));
      setHasLoaded(true);

      toast.success(
        isCreating ? "Configuracion creada correctamente" : "Configuracion actualizada correctamente",
      );

      void fetchSettings({
        showLoader: false,
        suppressError: true,
        syncForm: true,
      });

      return true;
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "No se pudo guardar la configuracion corporativa.";

      setError(message);
      toast.error(message);
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  function applyAssetChange(assetType: CompanyAssetType, nextUrl: string | null) {
    const field = getAssetField(assetType);

    setSettings((current) =>
      current
        ? {
            ...current,
            [field]: nextUrl,
            updated_at: new Date().toISOString(),
          }
        : current,
    );
  }

  return {
    settings,
    formData,
    isLoading,
    isSaving,
    error,
    hasLoaded,
    isDirty,
    isConfigured,
    canSave,
    validationErrors: validation.errors,
    fetchSettings,
    updateField,
    saveSettings,
    resetForm,
    applyAssetChange,
  };
}
