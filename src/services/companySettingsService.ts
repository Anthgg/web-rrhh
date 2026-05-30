"use client";

import { ApiClientError, apiClient } from "@/lib/api/client";
import { webApiEndpoints } from "@/lib/api/endpoints";
import type {
  CompanyAssetType,
  CompanySettings,
  CompanySettingsPayload,
  CompanySettingsResponse,
} from "@/types";

export const DEFAULT_COMPANY_PRIMARY_COLOR = "#1E3A8A";
export const DEFAULT_COMPANY_SECONDARY_COLOR = "#64748B";
export const DEFAULT_COMPANY_TEXT_COLOR = "#0F172A";
export const COMPANY_ASSET_MAX_SIZE_BYTES = 3 * 1024 * 1024;
export const COMPANY_ASSET_ACCEPT =
  ".jpg,.jpeg,.png,.webp,.svg,image/jpeg,image/png,image/webp,image/svg+xml";

const COMPANY_ASSET_ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
]);

const COMPANY_ASSET_ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".svg"];

class CompanySettingsServiceError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = "CompanySettingsServiceError";
  }
}

interface CompanyAssetOperationResponse {
  success: boolean;
  message: string;
  url: string | null;
}

type LooseRecord = Record<string, unknown>;

const assetPathMap: Record<CompanyAssetType, string[]> = {
  logo: [
    "data.logo_url",
    "data.logoUrl",
    "data.url",
    "data.file_url",
    "data.fileUrl",
    "data.asset_url",
    "data.assetUrl",
    "logo_url",
    "logoUrl",
    "url",
    "file_url",
    "fileUrl",
    "asset_url",
    "assetUrl",
  ],
  signature: [
    "data.firma_url",
    "data.firmaUrl",
    "data.signature_url",
    "data.signatureUrl",
    "data.url",
    "data.file_url",
    "data.fileUrl",
    "firma_url",
    "firmaUrl",
    "signature_url",
    "signatureUrl",
    "url",
    "file_url",
    "fileUrl",
  ],
  stamp: [
    "data.sello_url",
    "data.selloUrl",
    "data.stamp_url",
    "data.stampUrl",
    "data.url",
    "data.file_url",
    "data.fileUrl",
    "sello_url",
    "selloUrl",
    "stamp_url",
    "stampUrl",
    "url",
    "file_url",
    "fileUrl",
  ],
};

function asRecord(value: unknown): LooseRecord | null {
  return value && typeof value === "object" ? (value as LooseRecord) : null;
}

function readPath(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, segment) => {
    const record = asRecord(current);
    return record?.[segment];
  }, source);
}

function pickString(source: unknown, paths: string[], fallback = "") {
  for (const path of paths) {
    const value = readPath(source, path);

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return fallback;
}

function pickBoolean(source: unknown, paths: string[], fallback = true) {
  for (const path of paths) {
    const value = readPath(source, path);

    if (typeof value === "boolean") {
      return value;
    }
  }

  return fallback;
}

function normalizeNullableString(value: unknown) {
  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized || null;
}

function normalizeColor(value: unknown, fallback: string) {
  const normalized = normalizeNullableString(value)?.toUpperCase();
  return normalized && /^#([0-9A-F]{6})$/.test(normalized) ? normalized : fallback;
}

function isCompanySettingsLike(source: unknown) {
  return Boolean(
    pickString(source, [
      "razon_social",
      "ruc",
      "logo_url",
      "firma_url",
      "sello_url",
      "color_primario",
      "color_secundario",
      "color_texto",
    ]),
  );
}

function normalizeCompanySettings(source: unknown): CompanySettings {
  return {
    id: pickString(source, ["id", "uuid"]),
    razon_social: pickString(source, ["razon_social"]),
    nombre_comercial: normalizeNullableString(readPath(source, "nombre_comercial")),
    ruc: pickString(source, ["ruc"]),
    direccion_fiscal: normalizeNullableString(readPath(source, "direccion_fiscal")),
    telefono: normalizeNullableString(readPath(source, "telefono")),
    correo_corporativo: normalizeNullableString(readPath(source, "correo_corporativo")),
    pagina_web: normalizeNullableString(readPath(source, "pagina_web")),
    representante_legal: normalizeNullableString(readPath(source, "representante_legal")),
    color_primario: normalizeColor(readPath(source, "color_primario"), DEFAULT_COMPANY_PRIMARY_COLOR),
    color_secundario: normalizeColor(
      readPath(source, "color_secundario"),
      DEFAULT_COMPANY_SECONDARY_COLOR,
    ),
    color_texto: normalizeColor(readPath(source, "color_texto"), DEFAULT_COMPANY_TEXT_COLOR),
    logo_url: normalizeNullableString(readPath(source, "logo_url")),
    firma_url:
      normalizeNullableString(readPath(source, "firma_url")) ??
      normalizeNullableString(readPath(source, "signature_url")),
    sello_url:
      normalizeNullableString(readPath(source, "sello_url")) ??
      normalizeNullableString(readPath(source, "stamp_url")),
    updated_at: normalizeNullableString(readPath(source, "updated_at")),
  };
}

function normalizeOptionalBodyValue(value: string) {
  const normalized = value.trim();
  return normalized || undefined;
}

function normalizeCompanySettingsResponse(source: unknown): CompanySettingsResponse {
  const rawData = readPath(source, "data");
  const data =
    rawData === null
      ? null
      : isCompanySettingsLike(rawData)
        ? normalizeCompanySettings(rawData)
        : isCompanySettingsLike(source)
          ? normalizeCompanySettings(source)
          : null;

  return {
    success: pickBoolean(source, ["success"], true),
    message: pickString(
      source,
      ["message"],
      data
        ? "Configuracion corporativa obtenida correctamente"
        : "La empresa aun no tiene configuracion corporativa registrada",
    ),
    data,
  };
}

function normalizeCompanyAssetResponse(
  source: unknown,
  assetType: CompanyAssetType,
  fallbackMessage: string,
): CompanyAssetOperationResponse {
  return {
    success: pickBoolean(source, ["success"], true),
    message: pickString(source, ["message"], fallbackMessage),
    url: pickString(source, assetPathMap[assetType]) || null,
  };
}

function toRequestBody(payload: CompanySettingsPayload) {
  return {
    razon_social: payload.razon_social.trim(),
    nombre_comercial: normalizeOptionalBodyValue(payload.nombre_comercial),
    ruc: payload.ruc.trim(),
    direccion_fiscal: normalizeOptionalBodyValue(payload.direccion_fiscal),
    telefono: normalizeOptionalBodyValue(payload.telefono),
    correo_corporativo: normalizeOptionalBodyValue(payload.correo_corporativo),
    pagina_web: normalizeOptionalBodyValue(payload.pagina_web),
    representante_legal: normalizeOptionalBodyValue(payload.representante_legal),
    color_primario: payload.color_primario.trim().toUpperCase() || DEFAULT_COMPANY_PRIMARY_COLOR,
    color_secundario: payload.color_secundario.trim().toUpperCase() || DEFAULT_COMPANY_SECONDARY_COLOR,
    color_texto: payload.color_texto.trim().toUpperCase() || DEFAULT_COMPANY_TEXT_COLOR,
  };
}

function buildAssetFormData(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return formData;
}

function extractErrorMessage(source: unknown) {
  const message = pickString(
    source,
    [
      "details.response.data.message",
      "details.data.message",
      "details.message",
      "details.error",
      "response.data.message",
      "data.message",
      "message",
      "error",
    ],
    "",
  );

  return message && message !== "La solicitud no pudo completarse." ? message : "";
}

function mapStatusMessage(status?: number) {
  switch (status) {
    case 400:
      return "Archivo invalido. Verifica formato permitido y tamano maximo de 3 MB.";
    case 401:
      return "Sesion expirada o no autenticada.";
    case 403:
      return "No tienes permisos para editar esta configuracion.";
    case 422:
      return "Revisa los datos enviados antes de intentar nuevamente.";
    case 500:
      return "Ocurrio un error interno del servidor.";
    default:
      return "No se pudo completar la solicitud.";
  }
}

function normalizeCompanySettingsError(error: unknown) {
  if (error instanceof CompanySettingsServiceError) {
    return error;
  }

  if (error instanceof ApiClientError) {
    const fallbackMessage = mapStatusMessage(error.status);
    const message =
      extractErrorMessage({
        message: error.message,
        details: error.details,
      }) || fallbackMessage;

    return new CompanySettingsServiceError(message, error.status, error.details);
  }

  if (error instanceof TypeError) {
    return new CompanySettingsServiceError("Error de conexion con el servidor.");
  }

  if (error instanceof Error) {
    return new CompanySettingsServiceError(error.message || "No se pudo completar la solicitud.");
  }

  return new CompanySettingsServiceError("No se pudo completar la solicitud.");
}

export function createCompanySettingsFormData(
  settings?: CompanySettings | null,
): CompanySettingsPayload {
  return {
    razon_social: settings?.razon_social ?? "",
    nombre_comercial: settings?.nombre_comercial ?? "",
    ruc: settings?.ruc ?? "",
    direccion_fiscal: settings?.direccion_fiscal ?? "",
    telefono: settings?.telefono ?? "",
    correo_corporativo: settings?.correo_corporativo ?? "",
    pagina_web: settings?.pagina_web ?? "",
    representante_legal: settings?.representante_legal ?? "",
    color_primario: settings?.color_primario ?? DEFAULT_COMPANY_PRIMARY_COLOR,
    color_secundario: settings?.color_secundario ?? DEFAULT_COMPANY_SECONDARY_COLOR,
    color_texto: settings?.color_texto ?? DEFAULT_COMPANY_TEXT_COLOR,
  };
}

export function validateCompanyAssetFile(file: File) {
  const fileName = file.name.toLowerCase();
  const hasAllowedExtension = COMPANY_ASSET_ALLOWED_EXTENSIONS.some((extension) =>
    fileName.endsWith(extension),
  );

  const hasAllowedMimeType =
    COMPANY_ASSET_ALLOWED_MIME_TYPES.has(file.type) || (file.type === "" && hasAllowedExtension);

  if (!hasAllowedMimeType) {
    return "Formato de archivo no permitido.";
  }

  if (file.size > COMPANY_ASSET_MAX_SIZE_BYTES) {
    return "El archivo no debe superar los 3 MB.";
  }

  return null;
}

async function uploadCompanyAsset(
  assetType: CompanyAssetType,
  endpoint: string,
  file: File,
  successMessage: string,
) {
  const validationError = validateCompanyAssetFile(file);
  if (validationError) {
    throw new CompanySettingsServiceError(validationError, 400);
  }

  try {
    const response = await apiClient<unknown>(endpoint, {
      method: "POST",
      body: buildAssetFormData(file),
    });

    return normalizeCompanyAssetResponse(response, assetType, successMessage);
  } catch (error) {
    throw normalizeCompanySettingsError(error);
  }
}

async function deleteCompanyAsset(endpoint: string) {
  try {
    const response = await apiClient<unknown>(endpoint, {
      method: "DELETE",
    });

    return {
      success: pickBoolean(response, ["success"], true),
      message: pickString(response, ["message"], "Archivo eliminado correctamente"),
    };
  } catch (error) {
    throw normalizeCompanySettingsError(error);
  }
}

export async function getCompanySettings() {
  try {
    const response = await apiClient<unknown>(webApiEndpoints.companySettings.settings);
    return normalizeCompanySettingsResponse(response);
  } catch (error) {
    throw normalizeCompanySettingsError(error);
  }
}

export async function updateCompanySettings(payload: CompanySettingsPayload) {
  try {
    const response = await apiClient<unknown>(webApiEndpoints.companySettings.settings, {
      method: "PUT",
      body: toRequestBody(payload),
    });

    return normalizeCompanySettingsResponse(response);
  } catch (error) {
    throw normalizeCompanySettingsError(error);
  }
}

export function updateCompanyLegalInfo(payload: CompanySettingsPayload) {
  return updateCompanySettings(payload);
}

export function updateCompanyBrand(payload: CompanySettingsPayload) {
  return updateCompanySettings(payload);
}

export function uploadCompanyLogo(file: File) {
  return uploadCompanyAsset(
    "logo",
    webApiEndpoints.companySettings.logo,
    file,
    "Logo subido correctamente",
  );
}

export function uploadCompanySignature(file: File) {
  return uploadCompanyAsset(
    "signature",
    webApiEndpoints.companySettings.signature,
    file,
    "Firma actualizada correctamente",
  );
}

export function uploadCompanyStamp(file: File) {
  return uploadCompanyAsset(
    "stamp",
    webApiEndpoints.companySettings.stamp,
    file,
    "Sello actualizado correctamente",
  );
}

export function deleteCompanyLogo() {
  return deleteCompanyAsset(webApiEndpoints.companySettings.logo);
}

export function deleteCompanySignature() {
  return deleteCompanyAsset(webApiEndpoints.companySettings.signature);
}

export function deleteCompanyStamp() {
  return deleteCompanyAsset(webApiEndpoints.companySettings.stamp);
}
