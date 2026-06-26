"use client";

import { useRouter } from "next/navigation";

import { AppLottie } from "@/components/ui/feedback/AppLottie";
import { feedbackAnimations } from "@/components/ui/feedback/animation-registry";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface NotFoundStateProps {
 title?: string;
 description?: string;
 actionLabel?: string;
 className?: string;
}

export function NotFoundState({
 title = "Pagina no encontrada",
 description = "La ruta solicitada no existe o fue movida.",
 actionLabel = "Volver al dashboard",
 className,
}: NotFoundStateProps) {
 const router = useRouter();

 return (
 <section
 className={cn(
 "flex min-h-[calc(100vh-var(--header-height,0px))] w-full items-center justify-center bg-background px-4 py-10 text-center text-foreground",
 className,
 )}
 >
 <div className="grid w-full max-w-3xl place-items-center gap-5">
 <AppLottie
 src={feedbackAnimations.notFound}
 className="h-[300px] w-[300px] md:h-[420px] md:w-[420px]"
 ariaLabel="Pagina no encontrada"
 />
 <div className="grid max-w-xl gap-2">
 <span className="mx-auto rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
 Error 404
 </span>
 <h1 className="section-title text-2xl font-semibold text-foreground md:text-3xl">{title}</h1>
 {description ? (
 <p className="text-sm leading-6 text-muted-foreground md:text-base">{description}</p>
 ) : null}
 </div>
 <Button onClick={() => router.push("/dashboard")}>{actionLabel}</Button>
 </div>
 </section>
 );
}
