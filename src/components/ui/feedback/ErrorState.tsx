"use client";

import { useRouter } from "next/navigation";

import { AppLottie } from "@/components/ui/feedback/AppLottie";
import { FeedbackLayout } from "@/components/ui/feedback/FeedbackLayout";
import { feedbackAnimations } from "@/components/ui/feedback/animation-registry";
import { Button } from "@/components/ui/button";

type ErrorType = "500" | "503" | "generic";

interface ErrorStateProps {
 title: string;
 description: string;
 errorType?: ErrorType;
 statusCode?: number | string;
 onRetry?: () => void;
 retryLabel?: string;
 onGoBack?: () => void;
 goBackLabel?: string;
 className?: string;
}

function getErrorAnimation(errorType: ErrorType) {
 if (errorType === "503") return feedbackAnimations.serviceUnavailable;
 return feedbackAnimations.serverError;
}

export function ErrorState({
 title,
 description,
 errorType,
 statusCode,
 onRetry,
 retryLabel = "Reintentar",
 onGoBack,
 goBackLabel = "Volver al dashboard",
 className,
}: ErrorStateProps) {
 const router = useRouter();
 const resolvedErrorType = errorType ?? (String(statusCode) === "503" ? "503" : "500");
 const showGoBack = Boolean(onGoBack || statusCode);

 return (
 <FeedbackLayout
 className={className}
 animationClassName="h-[240px] w-[240px] md:h-[320px] md:w-[320px]"
 title={title}
 description={description}
 statusCode={statusCode}
 animation={
 <AppLottie
 src={getErrorAnimation(resolvedErrorType)}
 className="size-full"
 ariaLabel={resolvedErrorType === "503" ? "Servicio no disponible" : "Error del servidor"}
 />
 }
 actions={
 onRetry || showGoBack ? (
 <>
 {onRetry ? <Button onClick={onRetry}>{retryLabel}</Button> : null}
 {onGoBack ? (
 <Button variant="secondary" onClick={onGoBack}>
 {goBackLabel}
 </Button>
 ) : statusCode ? (
 <Button variant="secondary" onClick={() => router.push("/dashboard")}>
 {goBackLabel}
 </Button>
 ) : null}
 </>
 ) : undefined
 }
 />
 );
}
