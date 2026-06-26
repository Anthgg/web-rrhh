import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

interface FeedbackLayoutProps {
 animation: ReactNode;
 title: string;
 description?: string;
 actions?: ReactNode;
 statusCode?: number | string;
 className?: string;
 animationClassName?: string;
 compact?: boolean;
}

export function FeedbackLayout({
 animation,
 title,
 description,
 actions,
 statusCode,
 className,
 animationClassName,
 compact = false,
}: FeedbackLayoutProps) {
 return (
 <div
 className={cn(
 "grid place-items-center rounded-2xl border border-border bg-card text-center shadow-sm",
 compact ? "gap-3 p-5" : "gap-5 p-6 sm:p-8",
 className,
 )}
 >
 <div className={cn("mx-auto", animationClassName ?? (compact ? "size-24" : "size-40 sm:size-48"))}>
 {animation}
 </div>
 <div className="grid max-w-xl gap-2">
 {statusCode ? (
 <span className="mx-auto rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
 Error {statusCode}
 </span>
 ) : null}
 <h2 className={cn("section-title font-semibold text-foreground", compact ? "text-lg" : "text-2xl")}>
 {title}
 </h2>
 {description ? (
 <p className="text-sm leading-6 text-muted-foreground">{description}</p>
 ) : null}
 </div>
 {actions ? <div className="flex flex-wrap items-center justify-center gap-3">{actions}</div> : null}
 </div>
 );
}
