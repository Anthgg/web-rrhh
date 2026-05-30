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
        "group grid min-h-[148px] gap-4 rounded-lg border bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md",
        isComplete ? "border-emerald-200" : "border-slate-200",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-lg",
            isComplete ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500",
          )}
        >
          <Icon className="size-5" />
        </div>

        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
            isComplete ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
          )}
        >
          <StatusIcon className="size-3.5" />
          {label}
        </span>
      </div>

      <div className="grid gap-1">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        <p className="text-sm leading-5 text-ink-soft">{description}</p>
      </div>
    </div>
  );
}
