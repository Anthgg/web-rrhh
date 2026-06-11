"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface ProfileFieldProps {
 label: string;
 value: string | number | null | undefined;
 icon?: ReactNode;
 fullWidth?: boolean;
 highlight?: "success" | "warning" | "error";
}

const highlightMap = {
 success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-500",
 warning: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-500",
 error: "bg-destructive/10 border-destructive/20 text-destructive",
};

export function ProfileField({ label, value, icon, fullWidth, highlight }: ProfileFieldProps) {
 const displayValue =
 value !== null && value !== undefined && String(value).trim() !== ""
 ? String(value)
 : "No registrado";
 const isFallback = displayValue === "No registrado";

 return (
 <div
 className={cn(
 "flex items-start gap-3 py-3 border-b border-border/50 last:border-b-0",
 fullWidth && "col-span-full",
 )}
 >
 {icon && (
 <div className="size-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 mt-0.5">
 {icon}
 </div>
 )}
 <div className="flex flex-col min-w-0 gap-0.5">
 <span className="text-[10px] text-muted-foreground uppercase tracking-[0.07em] font-bold">
 {label}
 </span>
 {highlight && !isFallback ? (
 <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold w-fit border", highlightMap[highlight])}>
 {displayValue}
 </span>
 ) : (
 <span
 className={cn(
 "text-sm font-semibold truncate leading-snug",
 isFallback ? "text-muted-foreground/50 italic font-normal" : "text-foreground",
 )}
 >
 {displayValue}
 </span>
 )}
 </div>
 </div>
 );
}
