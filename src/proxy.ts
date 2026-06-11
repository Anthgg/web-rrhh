import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const ACCESS_TOKEN_COOKIE = "fabryor_access_token";
const REFRESH_TOKEN_COOKIE = "fabryor_refresh_token";

const protectedRoutePrefixes = [
 "/dashboard",
 "/solicitudes",
 "/documentos",
 "/trabajadores",
 "/reportes",
 "/perfil",
 "/estructura",
 "/equipos-de-trabajo",
] as const;

const isProtectedPath = (pathname: string) =>
 protectedRoutePrefixes.some((prefix) => pathname.startsWith(prefix));

export function proxy(request: NextRequest) {
 const { pathname } = request.nextUrl;
 const reason = request.nextUrl.searchParams.get("reason");
 const hasSessionCandidate =
 Boolean(request.cookies.get(ACCESS_TOKEN_COOKIE)?.value) ||
 Boolean(request.cookies.get(REFRESH_TOKEN_COOKIE)?.value);

 if (pathname === "/") {
 const target = hasSessionCandidate ? "/dashboard" : "/login";
 return NextResponse.redirect(new URL(target, request.url));
 }

 if (pathname === "/login" && hasSessionCandidate && !reason) {
 return NextResponse.redirect(new URL("/dashboard", request.url));
 }

 if (isProtectedPath(pathname) && !hasSessionCandidate) {
 const url = new URL("/login", request.url);
 url.searchParams.set("reason", "auth-required");
 return NextResponse.redirect(url);
 }

 return NextResponse.next();
}

export const config = {
 matcher: [
 "/",
 "/login",
 "/dashboard/:path*",
 "/solicitudes/:path*",
 "/documentos/:path*",
 "/trabajadores/:path*",
 "/reportes/:path*",
 "/perfil/:path*",
 "/estructura/:path*",
 "/roles/:path*",
 "/equipos-de-trabajo/:path*",
 ],
};
