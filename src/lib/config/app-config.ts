import { backendBaseUrl } from "@/lib/api/endpoints";

const resolveBackendBaseUrl = () => {
  try {
    return new URL(backendBaseUrl).toString();
  } catch {
    throw new Error(`URL de backend invalida: ${backendBaseUrl}`);
  }
};

export const appConfig = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "FABRYOR Admin",
  backendBaseUrl: resolveBackendBaseUrl(),
  authDebug: process.env.AUTH_DEBUG === "true",
} as const;
