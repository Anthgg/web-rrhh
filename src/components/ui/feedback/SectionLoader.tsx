import { AppLottie } from "@/components/ui/feedback/AppLottie";
import { feedbackAnimations } from "@/components/ui/feedback/animation-registry";
import { cn } from "@/lib/utils/cn";

interface SectionLoaderProps {
 title?: string;
 variant?: "default" | "processing";
 className?: string;
}

export function SectionLoader({
 title = "Cargando...",
 variant = "default",
 className,
}: SectionLoaderProps) {
 const animationSrc =
 variant === "processing" ? feedbackAnimations.processing : feedbackAnimations.loading;

 return (
 <div
 className={cn(
 "flex min-h-28 items-center justify-center gap-3 rounded-lg bg-muted/40 p-4 text-muted-foreground",
 className,
 )}
 role="status"
 aria-live="polite"
 aria-busy="true"
 >
 <AppLottie src={animationSrc} className="size-12 shrink-0" ariaLabel={title} />
 <span className="text-sm font-medium text-muted-foreground">{title}</span>
 </div>
 );
}
