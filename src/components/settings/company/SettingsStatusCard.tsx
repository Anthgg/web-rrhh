import type { LucideIcon } from "lucide-react";
import { CheckCircle2, CircleDashed } from "lucide-react";

import { cn } from "@/lib/utils/cn";

interface SettingsStatusCardProps {
 description: string;
 icon: LucideIcon;
 isComplete: boolean;
 label: string;
 title: string;
}

export function SettingsStatusCard({
 description,
 icon: Icon,
 isComplete,
 label,
 title,
}: SettingsStatusCardProps) {
 const StatusIcon = isComplete ? CheckCircle2 : CircleDashed;

 return (
 <div
 className={cn(
 "group grid min-h-[148px] gap-4 rounded-lg border bg-card p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md",
 isComplete ? "border-emerald-500/30" : "border-border",
 )}
 >
 <div className="flex items-start justify-between gap-3">
 <div
 className={cn(
 "flex size-10 items-center justify-center rounded-lg",
 isComplete ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground",
 )}
 >
 <Icon className="size-5" />
 </div>

 <span
 className={cn(
 "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
 isComplete
 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
 : "bg-amber-500/10 text-amber-700 dark:text-amber-400",
 )}
 >
 <StatusIcon className="size-3.5" />
 {label}
 </span>
 </div>

 <div className="grid gap-1">
 <h3 className="text-sm font-semibold text-foreground">{title}</h3>
 <p className="text-sm leading-5 text-muted-foreground">{description}</p>
 </div>
 </div>
 );
}
