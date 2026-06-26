import type { ProfileSession } from "@/types";
import { parseDeviceInfo } from "@/lib/security/device-parser";
import { Monitor, Laptop, Smartphone, Tablet } from "lucide-react";
import type { ComponentType } from "react";

type SafeDeviceType = "desktop" | "laptop" | "mobile" | "tablet" | "unknown";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object";

const readString = (record: Record<string, unknown>, keys: string[]): string | null => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return null;
};

const readBoolean = (record: Record<string, unknown>, keys: string[]): boolean | null => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const normalized = value.toLowerCase();
      if (normalized === "true") return true;
      if (normalized === "false") return false;
    }
  }
  return null;
};

const readNumber = (record: Record<string, unknown>, keys: string[]): number | null => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
};

export function isUuid(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return /^[0-9a-fA-F-]{36}$/.test(value.trim());
}

export function isBadDeviceName(value: unknown): boolean {
  if (!value || typeof value !== "string") return true;
  const trimmed = value.trim().toLowerCase();
  if (
    trimmed === "" ||
    trimmed === "null" ||
    trimmed === "undefined" ||
    trimmed === "unknown" ||
    trimmed === "desconocido" ||
    trimmed === "sesion activa" ||
    trimmed === "sesiÃ³n activa" ||
    isUuid(value)
  ) {
    return true;
  }
  return false;
}

function isSafeDeviceType(value: unknown): value is SafeDeviceType {
  return ["desktop", "laptop", "mobile", "tablet", "unknown"].includes(String(value));
}

export function getSafeDeviceType(session: Partial<ProfileSession>): SafeDeviceType {
  const type = session.deviceType?.trim().toLowerCase();
  if (isSafeDeviceType(type)) {
    return type;
  }
  if (session.userAgent) {
    const parsed = parseDeviceInfo(session.userAgent);
    if (isSafeDeviceType(parsed.deviceType)) {
      return parsed.deviceType;
    }
  }
  return "unknown";
}

export function getSafeBrowser(session: Partial<ProfileSession>): string {
  if (session.isLegacy) return "Navegador desconocido";
  const browser = session.browser;
  if (
    browser &&
    !isUuid(browser) &&
    browser.trim().toLowerCase() !== "unknown" &&
    browser.trim().toLowerCase() !== "desconocido" &&
    browser.trim().toLowerCase() !== "null" &&
    browser.trim().toLowerCase() !== "undefined"
  ) {
    return browser.trim();
  }
  if (session.userAgent) {
    const parsed = parseDeviceInfo(session.userAgent);
    if (
      parsed.browser &&
      parsed.browser.toLowerCase() !== "unknown" &&
      parsed.browser.toLowerCase() !== "desconocido"
    ) {
      return parsed.browser;
    }
  }
  return "Navegador desconocido";
}

export function getSafeOs(session: Partial<ProfileSession>): string {
  if (session.isLegacy) return "Sistema desconocido";
  const os = session.os;
  if (
    os &&
    !isUuid(os) &&
    os.trim().toLowerCase() !== "unknown" &&
    os.trim().toLowerCase() !== "desconocido" &&
    os.trim().toLowerCase() !== "null" &&
    os.trim().toLowerCase() !== "undefined"
  ) {
    return os.trim();
  }
  if (session.userAgent) {
    const parsed = parseDeviceInfo(session.userAgent);
    if (
      parsed.os &&
      parsed.os.toLowerCase() !== "unknown" &&
      parsed.os.toLowerCase() !== "desconocido"
    ) {
      return parsed.os;
    }
  }
  return "Sistema desconocido";
}

export function getSafeDeviceName(session: Partial<ProfileSession>): string {
  if (session.isLegacy) {
    return "SesiÃ³n antigua";
  }

  const devName = session.deviceName;
  if (devName && !isBadDeviceName(devName)) {
    return devName.trim();
  }

  const os = getSafeOs(session);
  const browser = getSafeBrowser(session);

  const fallbackBrowser = browser === "Navegador desconocido" ? "Navegador desconocido" : browser;
  const fallbackOs = os === "Sistema desconocido" ? "Sistema desconocido" : os;

  return `${fallbackBrowser} en ${fallbackOs}`;
}

export function getSafeLocation(session: Partial<ProfileSession>): string {
  const loc = session.location?.trim();
  if (
    loc &&
    loc.toLowerCase() !== "null" &&
    loc.toLowerCase() !== "undefined" &&
    loc.toLowerCase() !== "desconocido" &&
    loc.toLowerCase() !== "unknown"
  ) {
    return loc;
  }
  const city = session.city?.trim();
  const country = session.country?.trim();
  if (
    city &&
    country &&
    city.toLowerCase() !== "null" &&
    city.toLowerCase() !== "undefined" &&
    country.toLowerCase() !== "null" &&
    country.toLowerCase() !== "undefined"
  ) {
    return `${city}, ${country}`;
  }
  if (country && country.toLowerCase() !== "null" && country.toLowerCase() !== "undefined") {
    return country;
  }
  return "UbicaciÃ³n desconocida";
}

export function getSafeIp(session: Partial<ProfileSession>): string {
  const ip = session.ipAddress;
  if (
    ip &&
    ip.trim().toLowerCase() !== "null" &&
    ip.trim().toLowerCase() !== "undefined" &&
    ip.trim().toLowerCase() !== "unknown"
  ) {
    return ip.trim();
  }
  return "IP no disponible";
}

export function normalizeProfileSession(value: unknown): ProfileSession | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;

  const id = readString(record, ["id", "sessionId", "session_id"]);
  if (!id) return null;

  const userId = readString(record, ["userId", "user_id"]) ?? "";
  const isTrusted = readBoolean(record, ["isTrusted", "is_trusted", "trusted"]) ?? false;
  const canTrust = readBoolean(record, ["canTrust", "can_trust"]) ?? false;
  const userAgent = readString(record, ["userAgent", "user_agent"]);
  const ipAddress = readString(record, ["ipAddress", "ip_address", "ip"]);

  const isLegacy = readBoolean(record, ["isLegacy", "is_legacy"]) ?? (!userAgent && !ipAddress);

  const rawSession: Partial<ProfileSession> = {
    id,
    userId,
    userAgent,
    ipAddress,
    location: readString(record, ["location"]),
    country: readString(record, ["country"]),
    city: readString(record, ["city"]),
    latitude: readNumber(record, ["latitude"]),
    longitude: readNumber(record, ["longitude"]),
    browser: readString(record, ["browser"]),
    os: readString(record, ["os"]),
    deviceType: getSafeDeviceType({
      deviceType: readString(record, ["deviceType", "device_type"]) as ProfileSession["deviceType"],
      userAgent,
    }),
    deviceName: readString(record, ["deviceName", "device_name"]),
    isTrusted,
    trustedAt: readString(record, ["trustedAt", "trusted_at"]),
    createdAt: readString(record, ["createdAt", "created_at"]),
    lastActivityAt: readString(record, ["lastActivityAt", "last_activity_at"]),
    expiresAt: readString(record, ["expiresAt", "expires_at"]),
    isCurrent: readBoolean(record, ["isCurrent", "is_current", "current"]) ?? false,
    canTrust,
    trustAvailableAt: readString(record, ["trustAvailableAt", "trust_available_at"]),
    revokedAt: readString(record, ["revokedAt", "revoked_at"]),
    isLegacy,
    trustExpiresAt: readString(record, ["trustExpiresAt", "trust_expires_at"]),
    deviceId: readString(record, ["deviceId", "device_id"]),
  };

  const normalized: ProfileSession = {
    id: rawSession.id || id,
    userId: rawSession.userId || userId,
    userAgent: rawSession.userAgent ?? null,
    ipAddress: rawSession.ipAddress ?? null,
    location: rawSession.location ?? null,
    country: rawSession.country ?? null,
    city: rawSession.city ?? null,
    latitude: rawSession.latitude ?? null,
    longitude: rawSession.longitude ?? null,
    browser: rawSession.browser ?? null,
    os: rawSession.os ?? null,
    deviceType: rawSession.deviceType ?? null,
    deviceName: rawSession.deviceName ?? null,
    isTrusted: rawSession.isTrusted ?? false,
    trustedAt: rawSession.trustedAt ?? null,
    createdAt: rawSession.createdAt ?? null,
    lastActivityAt: rawSession.lastActivityAt ?? null,
    expiresAt: rawSession.expiresAt ?? null,
    isCurrent: rawSession.isCurrent ?? false,
    canTrust: rawSession.canTrust ?? false,
    trustAvailableAt: rawSession.trustAvailableAt ?? null,
    revokedAt: rawSession.revokedAt ?? null,
    isLegacy: rawSession.isLegacy ?? false,
    trustExpiresAt: rawSession.trustExpiresAt ?? null,
    deviceId: rawSession.deviceId ?? null,
  };

  return normalized;
}

export function normalizeProfileSessionsResponse(response: unknown): ProfileSession[] {
  if (Array.isArray(response)) {
    return response.map(normalizeProfileSession).filter((s): s is ProfileSession => s !== null);
  }
  if (!isRecord(response)) return [];

  if (isRecord(response.data) && Array.isArray(response.data.sessions)) {
    return response.data.sessions
      .map(normalizeProfileSession)
      .filter((s): s is ProfileSession => s !== null);
  }

  if (Array.isArray(response.sessions)) {
    return response.sessions
      .map(normalizeProfileSession)
      .filter((s): s is ProfileSession => s !== null);
  }

  if (Array.isArray(response.data)) {
    return response.data
      .map(normalizeProfileSession)
      .filter((s): s is ProfileSession => s !== null);
  }

  return [];
}

// â”€â”€â”€ Recommended Helper Utilities â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function formatDateTime(value: string | null, fallback = "Sin actividad registrada"): string {
  if (!value) return fallback;
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return fallback;
  }
}

export function formatTrustAvailableAt(value: string | null): string {
  if (!value) return "";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return "";
  }
}

export function getSessionLocation(session: ProfileSession): string {
  if (session.location && session.location.trim()) {
    return session.location.trim();
  }
  const city = session.city?.trim();
  const country = session.country?.trim();
  if (city && country) {
    return `${city}, ${country}`;
  }
  if (city) return city;
  if (country) return country;
  return "UbicaciÃ³n desconocida";
}

export function getSessionDeviceLabel(session: ProfileSession): string {
  return getSafeDeviceName(session);
}

/**
 * Maps deviceType to a human-readable Spanish label.
 */
export function getDeviceTypeLabelEs(deviceType: string | null | undefined): string {
  const type = String(deviceType ?? "").toLowerCase().trim();
  switch (type) {
    case "desktop": return "Escritorio";
    case "laptop": return "PortÃ¡til";
    case "mobile": return "MÃ³vil";
    case "tablet": return "Tablet";
    default: return "Tipo no identificado";
  }
}

/**
 * Formats a date string as a relative time label in Spanish.
 * Returns "Hace X minutos", "Hace X horas", "Hoy HH:MM", or a short date.
 */
export function getRelativeTimeLabel(value: string | null, fallback = "Sin actividad registrada"): string {
  if (!value) return fallback;
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return fallback;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    const diffHours = Math.floor(diffMs / 3_600_000);

    if (diffMins < 1) return "Ahora mismo";
    if (diffMins < 60) return `Hace ${diffMins} ${diffMins === 1 ? "minuto" : "minutos"}`;
    if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? "hora" : "horas"}`;

    // Same day â†’ "Hoy HH:MM"
    if (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    ) {
      return `Hoy ${d.toLocaleString("es-PE", { hour: "2-digit", minute: "2-digit" })}`;
    }

    // Fallback to short date
    return d.toLocaleString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return fallback;
  }
}

export function warnIfNodeUserAgent(session: ProfileSession): void {
  if (
    process.env.NODE_ENV === "development" &&
    session.userAgent?.toLowerCase() === "node"
  ) {
    void (
      session
    );
  }
}

export function getDeviceIcon(deviceType: string | null): ComponentType<{ className?: string }> {
  const type = String(deviceType ?? "").toLowerCase().trim();
  if (type === "laptop") return Laptop;
  if (type === "mobile") return Smartphone;
  if (type === "tablet") return Tablet;
  return Monitor; // desktop, unknown, or null map to Monitor
}

export function isTrustWaitingPeriodError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as Record<string, unknown>;
  
  if (isRecord(err.response)) {
    const status = err.response.status;
    const data = err.response.data;
    if (status === 422 && isRecord(data)) {
      const code = data.error_code ?? data.errorCode ?? data.code;
      if (code === "TRUST_WAITING_PERIOD_NOT_MET") return true;
    }
  }

  const status = err.status;
  const code = err.code ?? err.errorCode;
  if (status === 422 && code === "TRUST_WAITING_PERIOD_NOT_MET") {
    return true;
  }

  return false;
}

export function getTrustAvailableAt(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const err = error as Record<string, unknown>;

  const response = isRecord(err.response) ? err.response : null;
  const responseData = response && isRecord(response.data) ? response.data : null;
  const responseDetails = responseData && isRecord(responseData.details) ? responseData.details : null;

  if (responseDetails?.trustAvailableAt) {
    return String(responseDetails.trustAvailableAt);
  }
  if (responseDetails?.trust_available_at) {
    return String(responseDetails.trust_available_at);
  }
  if (responseData?.trustAvailableAt) {
    return String(responseData.trustAvailableAt);
  }
  if (isRecord(err.details)) {
    const details = err.details;
    if (details.trustAvailableAt) return String(details.trustAvailableAt);
    if (details.trust_available_at) return String(details.trust_available_at);
  }
  if (isRecord(err.payload) && isRecord(err.payload.details) && err.payload.details.trustAvailableAt) {
    return String(err.payload.details.trustAvailableAt);
  }
  return null;
}
