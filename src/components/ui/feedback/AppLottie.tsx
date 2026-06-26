"use client";

import dynamic from "next/dynamic";
import { AlertCircle } from "lucide-react";
import {
 type CSSProperties,
 type ComponentType,
 useCallback,
 useEffect,
 useMemo,
 useRef,
 useState,
} from "react";
import type { DotLottie, DotLottieReactProps } from "@lottiefiles/dotlottie-react";
import type { LottieComponentProps } from "lottie-react";

import { cn } from "@/lib/utils/cn";

const DotLottiePlayer = dynamic(
 () =>
 import("@lottiefiles/dotlottie-react").then(
 (mod) => mod.DotLottieReact as ComponentType<DotLottieReactProps>,
 ),
 { ssr: false },
);

const JsonLottiePlayer = dynamic(
 () => import("lottie-react").then((mod) => mod.default as ComponentType<LottieComponentProps>),
 { ssr: false },
);

export interface AppLottieProps {
 src?: string;
 animationData?: unknown;
 className?: string;
 width?: number | string;
 height?: number | string;
 loop?: boolean;
 autoplay?: boolean;
 ariaLabel: string;
}

function useReducedMotion() {
 const [reducedMotion, setReducedMotion] = useState(false);

 useEffect(() => {
 const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
 const update = () => setReducedMotion(mediaQuery.matches);

 update();
 mediaQuery.addEventListener("change", update);

 return () => mediaQuery.removeEventListener("change", update);
 }, []);

 return reducedMotion;
}

function LottieFallback({ ariaLabel }: { ariaLabel: string }) {
 return (
 <div
 className="flex size-full min-h-16 min-w-16 items-center justify-center rounded-lg bg-muted text-muted-foreground"
 role="img"
 aria-label={ariaLabel}
 >
 <AlertCircle className="size-6" aria-hidden="true" />
 </div>
 );
}

export function AppLottie({
 src,
 animationData,
 className,
 width,
 height,
 loop = true,
 autoplay = true,
 ariaLabel,
}: AppLottieProps) {
 const reducedMotion = useReducedMotion();
 const animationKey = src ?? (animationData ? `json:${ariaLabel}` : "empty");
 const isJsonSource = Boolean(src && src.split("?")[0].toLowerCase().endsWith(".json"));
 const [failedAnimationKey, setFailedAnimationKey] = useState<string | null>(null);
 const [remoteAnimation, setRemoteAnimation] = useState<{ key: string; data: unknown } | null>(null);
 const cleanupDotLottieRef = useRef<() => void>(() => undefined);
 const hasFailed = failedAnimationKey === animationKey;
 const shouldAutoplay = autoplay && !reducedMotion;
 const remoteAnimationData = remoteAnimation?.key === animationKey ? remoteAnimation.data : null;
 const resolvedAnimationData = animationData ?? remoteAnimationData;
 const style = useMemo<CSSProperties | undefined>(
 () => (width || height ? { width, height } : undefined),
 [height, width],
 );

 useEffect(() => {
 if (!src || !isJsonSource || animationData) {
 return;
 }

 const controller = new AbortController();

 void fetch(src, { signal: controller.signal })
 .then((response) => {
 if (!response.ok) throw new Error(`Unable to load animation ${src}`);
 return response.json();
 })
 .then((data: unknown) => {
 setRemoteAnimation({ key: animationKey, data });
 setFailedAnimationKey((current) => (current === animationKey ? null : current));
 })
 .catch((error: unknown) => {
 if (error instanceof DOMException && error.name === "AbortError") return;
 setFailedAnimationKey(animationKey);
 });

 return () => controller.abort();
 }, [animationData, animationKey, isJsonSource, src]);

 const bindDotLottie = useCallback((player: DotLottie | null) => {
 cleanupDotLottieRef.current();
 cleanupDotLottieRef.current = () => undefined;

 if (!player) return;

 const handleLoad = () => {
 setFailedAnimationKey((current) => (current === animationKey ? null : current));
 };
 const handleError = () => setFailedAnimationKey(animationKey);

 player.addEventListener("load", handleLoad);
 player.addEventListener("loadError", handleError);
 player.addEventListener("renderError", handleError);

 cleanupDotLottieRef.current = () => {
 player.removeEventListener("load", handleLoad);
 player.removeEventListener("loadError", handleError);
 player.removeEventListener("renderError", handleError);
 };
 }, [animationKey]);

 useEffect(() => () => cleanupDotLottieRef.current(), []);

 if (hasFailed || (!src && !animationData)) {
 return (
 <div className={cn("relative min-h-0 min-w-0 overflow-hidden", className)} style={style}>
 <LottieFallback ariaLabel={ariaLabel} />
 </div>
 );
 }

 if (isJsonSource && !resolvedAnimationData) {
 return (
 <div
 className={cn("relative min-h-0 min-w-0 overflow-hidden", className)}
 style={style}
 role="img"
 aria-label={ariaLabel}
 aria-busy="true"
 />
 );
 }

 return (
 <div
 className={cn("relative min-h-0 min-w-0 overflow-hidden", className)}
 style={style}
 role="img"
 aria-label={ariaLabel}
 >
 {resolvedAnimationData ? (
 <JsonLottiePlayer
 animationData={resolvedAnimationData}
 loop={loop}
 autoplay={shouldAutoplay}
 className="size-full"
 style={{ width: "100%", height: "100%" }}
 rendererSettings={{ preserveAspectRatio: "xMidYMid meet" }}
 onDataFailed={() => setFailedAnimationKey(animationKey)}
 aria-hidden="true"
 />
 ) : (
 <DotLottiePlayer
 src={src}
 loop={loop}
 autoplay={shouldAutoplay}
 className="size-full"
 style={{ width: "100%", height: "100%" }}
 dotLottieRefCallback={bindDotLottie}
 renderConfig={{ freezeOnOffscreen: true }}
 layout={{ fit: "contain", align: [0.5, 0.5] }}
 aria-hidden="true"
 />
 )}
 </div>
 );
}
