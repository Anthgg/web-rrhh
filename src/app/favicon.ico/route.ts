import { NextResponse } from "next/server";

export function GET(request: Request) {
 // Redirigir a la ruta estática proveída por Next.js en lugar de leer el sistema de archivos
 return NextResponse.redirect(new URL("/favicon.svg", request.url));
}
