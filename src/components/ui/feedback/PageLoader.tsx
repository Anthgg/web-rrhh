import { AppLottie } from "@/components/ui/feedback/AppLottie";
import { feedbackAnimations } from "@/components/ui/feedback/animation-registry";
import { cn } from "@/lib/utils/cn";

interface PageLoaderProps {
 title?: string;
 description?: string;
 variant?: "default" | "processing";
 className?: string;
}

export function PageLoader({
 title = "Cargando informacion",
 description = "Estamos obteniendo los datos del servidor.",
 variant = "default",
 className,
}: PageLoaderProps) {
 const animationSrc =
 variant === "processing" ? feedbackAnimations.processing : feedbackAnimations.loading;

 return (
 <div
 className={cn(
 "grid min-h-[min(70vh,640px)] w-full place-items-center px-4 py-8 text-center",
 className,
 )}
 role="status"
 aria-live="polite"
 aria-busy="true"
 >
 <div className="grid max-w-xl place-items-center gap-4">
 <AppLottie
 src={animationSrc}
 className="h-[220px] w-[220px] md:h-[280px] md:w-[280px]"
 ariaLabel={variant === "processing" ? "Procesando informacion" : "Cargando informacion"}
 />
 <div className="grid gap-2">
 <h2 className="section-title text-xl font-semibold text-foreground md:text-2xl">{title}</h2>
 {description ? (
 <p className="text-sm leading-6 text-muted-foreground md:text-base">{description}</p>
 ) : null}
 </div>
 </div>
 </div>
 );
}
