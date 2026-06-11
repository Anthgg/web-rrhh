"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface ProfileSectionCardProps {
 title: string;
 description?: string;
 icon?: ReactNode;
 iconColor?: "indigo" | "emerald" | "amber" | "rose" | "slate" | "violet";
 badge?: ReactNode;
 action?: ReactNode;
 children: ReactNode;
 className?: string;
 noPadding?: boolean;
}

const iconColorMap = {
 indigo: "bg-primary/10 text-primary",
 emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500",
 amber: "bg-amber-500/10 text-amber-600 dark:text-amber-500",
 rose: "bg-destructive/10 text-destructive",
 slate: "bg-muted text-muted-foreground",
 violet: "bg-primary/10 text-primary",
};

export function ProfileSectionCard({
 title,
 description,
 icon,
 iconColor = "indigo",
 badge,
 action,
 children,
 className,
 noPadding = false,
}: ProfileSectionCardProps) {
 return (
 <div
 className={cn(
 "bg-card border border-border rounded-2xl shadow-sm flex flex-col overflow-hidden",
 className,
 )}
 >
 {/* Card header */}
 <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
 <div className="flex items-start gap-3 min-w-0">
 {icon && (
 <div className={cn("p-2 rounded-xl shrink-0 mt-0.5", iconColorMap[iconColor])}>
 {icon}
 </div>
 )}
 <div className="min-w-0">
 <h2 className="text-[15px] font-bold text-card-foreground leading-snug">{title}</h2>
 {description && (
 <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
 )}
 </div>
 </div>
 <div className="flex items-center gap-2 shrink-0">
 {badge}
 {action}
 </div>
 </div>

 {/* Divider */}
 <div className="h-px bg-border/50 mx-5" />

 {/* Body */}
 <div className={cn("flex-1", noPadding ? "" : "p-5")}>
 {children}
 </div>
 </div>
 );
}
