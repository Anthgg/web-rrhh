"use client";

import { useRouter } from "next/navigation";

import { AppLottie } from "@/components/ui/feedback/AppLottie";
import { FeedbackLayout } from "@/components/ui/feedback/FeedbackLayout";
import { feedbackAnimations } from "@/components/ui/feedback/animation-registry";
import { Button } from "@/components/ui/button";

interface ServiceUnavailableStateProps {
 title?: string;
 description?: string;
 onRetry?: () => void;
 retryLabel?: string;
 goBackLabel?: string;
 className?: string;
}

export function ServiceUnavailableState({
 title = "Servicio temporalmente no disponible",
 description = "No pudimos conectar con el servidor. Puedes intentar nuevamente.",
 onRetry,
 retryLabel = "Reintentar",
 goBackLabel = "Volver al dashboard",
 className,
}: ServiceUnavailableStateProps) {
 const router = useRouter();

 return (
 <FeedbackLayout
 className={className}
 animationClassName="h-[240px] w-[240px] md:h-[320px] md:w-[320px]"
 title={title}
 description={description}
 statusCode="503"
 animation={
 <AppLottie
 src={feedbackAnimations.serviceUnavailable}
 className="size-full"
 ariaLabel="Servicio no disponible"
 />
 }
 actions={
 <>
 {onRetry ? <Button onClick={onRetry}>{retryLabel}</Button> : null}
 <Button variant="secondary" onClick={() => router.push("/dashboard")}>
 {goBackLabel}
 </Button>
 </>
 }
 />
 );
}
