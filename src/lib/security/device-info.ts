import { getDeviceFingerprint, setDeviceCookie } from "./device-fingerprint";

interface NavigatorUAData {
  platform: string;
  mobile: boolean;
  brands: Array<{ brand: string; version: string }>;
  getHighEntropyValues(hints: string[]): Promise<Record<string, string>>;
}

type NavigatorWithUAData = Navigator & {
  userAgentData?: NavigatorUAData;
};

export interface ClientDeviceInfo {
  userAgent: string;
  language?: string;
  timezone?: string;
  screen?: {
    width: number;
    height: number;
    pixelRatio: number;
  };
  clientHints?: {
    platform: string;
    mobile: boolean;
    model: string;
    brands?: Array<{ brand: string; version: string }>;
  };
  deviceId?: string;
}

export async function getClientDeviceInfo(): Promise<ClientDeviceInfo> {
  const deviceId = getDeviceFingerprint();
  if (deviceId) {
    setDeviceCookie(deviceId);
  }

  const info: ClientDeviceInfo = {
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    language: typeof navigator !== "undefined" ? navigator.language : "es",
    timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC",
    screen: {
      width: typeof window !== "undefined" ? window.screen.width : 0,
      height: typeof window !== "undefined" ? window.screen.height : 0,
      pixelRatio: typeof window !== "undefined" ? window.devicePixelRatio ?? 1 : 1,
    },
    clientHints: {
      platform: typeof navigator !== "undefined" ? navigator.platform ?? "" : "",
      mobile: false,
      model: "",
      brands: [],
    },
    deviceId: deviceId || undefined,
  };

  if (typeof navigator !== "undefined") {
    const nav = navigator as NavigatorWithUAData;
    if (nav.userAgentData) {
      try {
        const hints = await nav.userAgentData.getHighEntropyValues([
          "platform",
          "model",
        ]);
        info.clientHints = {
          platform: hints.platform || nav.userAgentData.platform || "",
          mobile: nav.userAgentData.mobile ?? false,
          model: hints.model || "",
          brands: nav.userAgentData.brands ?? [],
        };
      } catch {
        // Client Hints are optional; keep the baseline device info.
      }
    }
  }

  return info;
}
