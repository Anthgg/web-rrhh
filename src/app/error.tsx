"use client";

import { ErrorState } from "@/components/ui/feedback";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
 return (
 <main className="grid min-h-screen place-items-center bg-background p-4 text-foreground">
 <ErrorState
 className="w-full max-w-2xl"
 title="Error interno del servidor"
 description="Ocurrio un error inesperado al cargar la aplicacion."
 statusCode="500"
 onRetry={reset}
 />
 </main>
 );
}
