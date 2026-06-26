/**
 * Helper to generate a stable, non-sensitive device fingerprint.
 * It combines persistent storage (localStorage) and browser-level properties.
 */
export function getDeviceFingerprint(): string {
  if (typeof window === "undefined") return "";

  let storedSeed = "";
  try {
    storedSeed = localStorage.getItem("device_fingerprint_seed") || "";
    if (!storedSeed) {
      storedSeed = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem("device_fingerprint_seed", storedSeed);
    }
  } catch {
    // Fallback if localStorage is disabled or not accessible
    storedSeed = "nosf_" + Math.random().toString(36).substring(2, 10);
  }

  const screenInfo = window.screen 
    ? `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}` 
    : "";
  const timezone = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC";
  const language = typeof navigator !== "undefined" ? navigator.language : "es";
  const platform = typeof navigator !== "undefined" ? navigator.platform : "";
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";

  // Combine components into a stable raw string
  const rawFingerprint = `seed:${storedSeed}|ua:${userAgent}|lang:${language}|tz:${timezone}|screen:${screenInfo}|plat:${platform}`;

  // Simple DJB2 hash algorithm to avoid storing long unhashed user agents
  let hash = 0;
  for (let i = 0; i < rawFingerprint.length; i++) {
    const char = rawFingerprint.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const hashStr = Math.abs(hash).toString(16);

  return `dev_${hashStr}_${storedSeed}`;
}

/**
 * Persists the generated device fingerprint as a client cookie.
 * This makes it accessible to the Next.js server proxy.
 */
export function setDeviceCookie(deviceId: string) {
  if (typeof document === "undefined") return;
  try {
    const days = 365;
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    const secure = window.location.protocol === "https:" ? "Secure;" : "";
    document.cookie = `device_id=${deviceId};expires=${expires.toUTCString()};path=/;SameSite=Lax;${secure}`;
  } catch {
    // Silently ignore cookies writing failures
  }
}
