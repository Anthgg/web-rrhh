import { Buffer } from "node:buffer";

export interface JwtState {
  hasToken: boolean;
  exp: number | null;
  expiresAt: string | null;
  isExpired: boolean;
  secondsToExpire: number | null;
}

export function maskToken(token?: string | null) {
  if (!token) return "none";
  if (token.length <= 12) return `${token.slice(0, 3)}...`;
  return `${token.slice(0, 6)}...${token.slice(-4)}`;
}

function readJwtPayload(token: string) {
  const [, payload] = token.split(".");
  if (!payload) return null;

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Record<
      string,
      unknown
    >;
  } catch {
    return null;
  }
}

export function getJwtState(token?: string | null): JwtState {
  if (!token) {
    return {
      hasToken: false,
      exp: null,
      expiresAt: null,
      isExpired: true,
      secondsToExpire: null,
    };
  }

  const payload = readJwtPayload(token);
  const exp = typeof payload?.exp === "number" ? payload.exp : null;
  const now = Math.floor(Date.now() / 1000);
  const secondsToExpire = exp === null ? null : exp - now;

  return {
    hasToken: true,
    exp,
    expiresAt: exp === null ? null : new Date(exp * 1000).toISOString(),
    isExpired: secondsToExpire !== null && secondsToExpire <= 0,
    secondsToExpire,
  };
}
