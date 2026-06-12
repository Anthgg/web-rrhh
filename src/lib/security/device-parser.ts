export interface ParsedDeviceInfo {
  browser: string | null;
  os: string | null;
  deviceType: "desktop" | "mobile" | "tablet" | "laptop";
  isIdentified: boolean;
  label: string;
}

/**
 * Parses userAgent, browser, OS and deviceType from the session object.
 * Avoids showing UUIDs or raw "Desconocido" fallbacks in the main label.
 */
export function parseDeviceInfo(
  userAgent?: string | null,
  browserField?: string | null,
  osField?: string | null,
  deviceTypeField?: string | null
): ParsedDeviceInfo {
  let browser: string | null = null;
  let os: string | null = null;
  let deviceType: "desktop" | "mobile" | "tablet" | "laptop" = "desktop";

  const cleanUA = userAgent?.trim();

  if (cleanUA) {
    const ua = cleanUA.toLowerCase();

    // ── Parse OS ──
    if (ua.includes("windows")) {
      os = "Windows";
    } else if (ua.includes("macintosh") || ua.includes("mac os x") || ua.includes("macos")) {
      os = "macOS";
    } else if (ua.includes("android")) {
      os = "Android";
    } else if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) {
      os = "iOS";
    } else if (ua.includes("linux")) {
      os = "Linux";
    }

    // ── Parse Browser ──
    if (ua.includes("edg/")) {
      browser = "Microsoft Edge";
    } else if (ua.includes("chrome") || ua.includes("crios")) {
      browser = "Google Chrome";
    } else if (ua.includes("firefox") || ua.includes("fxios")) {
      browser = "Mozilla Firefox";
    } else if (ua.includes("safari")) {
      browser = "Apple Safari";
    } else if (ua.includes("opera") || ua.includes("opr/")) {
      browser = "Opera";
    }

    // ── Parse Device Type ──
    if (ua.includes("ipad") || (ua.includes("android") && !ua.includes("mobile"))) {
      deviceType = "tablet";
    } else if (ua.includes("mobile") || ua.includes("iphone") || ua.includes("ipod") || ua.includes("android")) {
      deviceType = "mobile";
    } else {
      deviceType = "desktop";
    }
  }

  // ── Fallback to fields sent by backend if not resolved by userAgent ──
  const isUuid = (str?: string | null) => {
    if (!str) return false;
    return /^[0-9a-fA-F-]{36}$/.test(str);
  };

  const cleanField = (val?: string | null) => {
    if (!val) return null;
    const lower = val.toLowerCase().trim();
    if (
      lower === "desconocido" ||
      lower === "unknown" ||
      lower === "sistema" ||
      lower === "navegador" ||
      lower === "null" ||
      lower === "undefined" ||
      isUuid(val)
    ) {
      return null;
    }
    return val.trim();
  };

  const parsedBrowser = cleanField(browserField);
  const parsedOs = cleanField(osField);

  if (!browser && parsedBrowser) {
    browser = parsedBrowser;
  }
  if (!os && parsedOs) {
    os = parsedOs;
  }

  const cleanDevice = deviceTypeField?.toLowerCase().trim();
  if (cleanDevice) {
    if (cleanDevice.includes("mobile") || cleanDevice.includes("phone") || cleanDevice.includes("movil") || cleanDevice.includes("móvil")) {
      deviceType = "mobile";
    } else if (cleanDevice.includes("tablet") || cleanDevice.includes("ipad")) {
      deviceType = "tablet";
    } else if (cleanDevice.includes("laptop")) {
      deviceType = "laptop";
    } else if (cleanDevice.includes("desktop")) {
      deviceType = "desktop";
    }
  }

  // Determine if we parsed something real
  const isIdentified = Boolean(browser || os);

  // Format final label
  let label = "Dispositivo no identificado";
  if (browser && os) {
    label = `${os} · ${browser}`;
  } else if (os) {
    label = os;
  } else if (browser) {
    label = browser;
  }

  return {
    browser,
    os,
    deviceType,
    isIdentified,
    label,
  };
}
