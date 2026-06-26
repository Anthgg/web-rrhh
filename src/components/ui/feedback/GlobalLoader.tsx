"use client";

import { useEffect, useState } from "react";

import { AppLottie } from "@/components/ui/feedback/AppLottie";
import { feedbackAnimations } from "@/components/ui/feedback/animation-registry";
import { useLoadingState } from "@/store/loading-store";

interface GlobalLoaderProps {
 message?: string;
 description?: string;
 variant?: "default" | "processing";
 visible?: boolean;
}

const MINIMUM_DELAY_MS = 400;

export function GlobalLoader(props: GlobalLoaderProps = {}) {
 const storeState = useLoadingState();
 const visible = props.visible ?? storeState.isLoading;
 const message = props.message ?? storeState.message;
 const description = props.description ?? storeState.description;
 const variant = props.variant ?? storeState.variant;
 const [shouldRender, setShouldRender] = useState(false);
 const animationSrc =
 variant === "processing" ? feedbackAnimations.processing : feedbackAnimations.loading;

 useEffect(() => {
 const timer = window.setTimeout(
 () => setShouldRender(visible),
 visible ? MINIMUM_DELAY_MS : 0,
 );
 return () => window.clearTimeout(timer);
 }, [visible]);

 if (!visible || !shouldRender) return null;

 return (
 <div
 className="fixed inset-0 z-[1000] grid place-items-center bg-background/80 px-4 backdrop-blur-md transition-opacity duration-200"
 role="status"
 aria-live="polite"
 aria-busy="true"
 >
 <div className="grid w-full max-w-md place-items-center gap-4 text-center">
 <AppLottie
 src={animationSrc}
 className="h-[260px] w-[260px] md:h-[320px] md:w-[320px]"
 ariaLabel={variant === "processing" ? "Procesando solicitud" : "Cargando informacion"}
 />
 <div className="grid gap-1">
 <p className="section-title text-lg font-semibold text-foreground">{message}</p>
 {description ? (
 <p className="text-sm leading-6 text-muted-foreground">{description}</p>
 ) : null}
 </div>
 </div>
 </div>
 );
}
