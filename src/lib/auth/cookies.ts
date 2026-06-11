import { cookies } from "next/headers";

import type { SessionData } from "@/types";

export const ACCESS_TOKEN_COOKIE = "fabryor_access_token";
export const REFRESH_TOKEN_COOKIE = "fabryor_refresh_token";
export const SESSION_SNAPSHOT_COOKIE = "fabryor_session_snapshot";

const baseCookieOptions = {
 httpOnly: true,
 secure: process.env.NODE_ENV === "production",
 sameSite: "lax" as const,
 path: "/",
};

export type TokenBundle = {
 accessToken: string;
 refreshToken?: string | null;
};

export async function getSessionCookies() {
 return cookies();
}

export async function setSessionCookies(tokens: TokenBundle) {
 const cookieStore = await cookies();

 cookieStore.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
 ...baseCookieOptions,
 maxAge: 60 * 60 * 8,
 });

 if (tokens.refreshToken) {
 cookieStore.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
 ...baseCookieOptions,
 maxAge: 60 * 60 * 24 * 7,
 });
 } else {
 cookieStore.delete(REFRESH_TOKEN_COOKIE);
 }
}

export async function setSessionSnapshot(session: SessionData) {
 const cookieStore = await cookies();

 cookieStore.set(SESSION_SNAPSHOT_COOKIE, encodeURIComponent(JSON.stringify(session)), {
 ...baseCookieOptions,
 maxAge: 60 * 60 * 8,
 });
}

export function readSessionSnapshot(value?: string | null) {
 if (!value) return null;

 try {
 return JSON.parse(decodeURIComponent(value)) as SessionData;
 } catch {
 return null;
 }
}

export async function clearSessionCookies() {
 const cookieStore = await cookies();

 cookieStore.delete(ACCESS_TOKEN_COOKIE);
 cookieStore.delete(REFRESH_TOKEN_COOKIE);
 cookieStore.delete(SESSION_SNAPSHOT_COOKIE);
}
